"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

type Algorithm = "bubble" | "quick" | "merge";

interface Snapshot {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
}

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
}

function computeBubbleSort(arr: number[]): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const a = [...arr];
  const sorted: number[] = [];

  for (let i = a.length - 1; i >= 0; i--) {
    let swapped = false;
    for (let j = 0; j < i; j++) {
      snapshots.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        snapshots.push({
          array: [...a],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
        });
      }
    }
    sorted.push(i);
    if (!swapped) {
      for (let k = 0; k <= i; k++) sorted.push(k);
      break;
    }
  }

  snapshots.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, i) => i),
  });
  return snapshots;
}

function computeQuickSort(arr: number[]): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const a = [...arr];
  const sortedIndices = new Set<number>();

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      snapshots.push({
        array: [...a],
        comparing: [j, hi],
        swapping: [],
        sorted: [...sortedIndices],
      });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          snapshots.push({
            array: [...a],
            comparing: [],
            swapping: [i, j],
            sorted: [...sortedIndices],
          });
        }
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    snapshots.push({
      array: [...a],
      comparing: [],
      swapping: [i + 1, hi],
      sorted: [...sortedIndices],
    });
    sortedIndices.add(i + 1);
    return i + 1;
  }

  function sort(lo: number, hi: number) {
    if (lo < hi) {
      const p = partition(lo, hi);
      sort(lo, p - 1);
      sort(p + 1, hi);
    } else if (lo === hi) {
      sortedIndices.add(lo);
    }
  }

  sort(0, a.length - 1);
  snapshots.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, i) => i),
  });
  return snapshots;
}

function computeMergeSort(arr: number[]): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const a = [...arr];
  const n = a.length;
  const sortedIndices = new Set<number>();

  for (let width = 1; width < n; width *= 2) {
    for (let i = 0; i < n; i += 2 * width) {
      const left = i;
      const mid = Math.min(i + width, n);
      const right = Math.min(i + 2 * width, n);
      const merged: number[] = [];
      let l = left;
      let r = mid;

      while (l < mid && r < right) {
        snapshots.push({
          array: [...a],
          comparing: [l, r],
          swapping: [],
          sorted: [...sortedIndices],
        });
        if (a[l] <= a[r]) {
          merged.push(a[l++]);
        } else {
          merged.push(a[r++]);
        }
      }
      while (l < mid) merged.push(a[l++]);
      while (r < right) merged.push(a[r++]);

      for (let k = 0; k < merged.length; k++) {
        a[left + k] = merged[k];
      }
      snapshots.push({
        array: [...a],
        comparing: [],
        swapping: Array.from({ length: right - left }, (_, k) => left + k),
        sorted: [...sortedIndices],
      });
    }
  }

  snapshots.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
  });
  return snapshots;
}

const algorithms: { value: Algorithm; label: string }[] = [
  { value: "bubble", label: "Bubble Sort" },
  { value: "quick", label: "Quick Sort" },
  { value: "merge", label: "Merge Sort" },
];

export function SortVisualizer() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("bubble");
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [baseArray, setBaseArray] = useState<number[]>(() =>
    generateArray(30)
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSnapshot: Snapshot = snapshots[currentStep] ?? {
    array: baseArray,
    comparing: [],
    swapping: [],
    sorted: [],
  };

  const isComplete =
    snapshots.length > 0 && currentStep >= snapshots.length - 1;

  const computeSnapshots = useCallback(
    (arr: number[], algo: Algorithm): Snapshot[] => {
      switch (algo) {
        case "bubble":
          return computeBubbleSort(arr);
        case "quick":
          return computeQuickSort(arr);
        case "merge":
          return computeMergeSort(arr);
      }
    },
    []
  );

  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    const newArr = generateArray(arraySize);
    setBaseArray(newArr);
    setSnapshots([]);
  }, [arraySize]);

  const handlePlay = useCallback(() => {
    let steps = snapshots;
    if (steps.length === 0) {
      steps = computeSnapshots(baseArray, algorithm);
      setSnapshots(steps);
    }

    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
  }, [snapshots, baseArray, algorithm, currentStep, computeSnapshots]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStep = useCallback(() => {
    let steps = snapshots;
    if (steps.length === 0) {
      steps = computeSnapshots(baseArray, algorithm);
      setSnapshots(steps);
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [snapshots, baseArray, algorithm, computeSnapshots]);

  useEffect(() => {
    if (isPlaying) {
      const delay = 101 - speed;
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, snapshots.length]);

  useEffect(() => {
    handleReset();
  }, [arraySize, algorithm, handleReset]);

  const maxVal = Math.max(...currentSnapshot.array, 1);

  function getBarColor(index: number): string {
    if (currentSnapshot.sorted.includes(index)) return "bg-emerald-400";
    if (currentSnapshot.swapping.includes(index)) return "bg-red-400";
    if (currentSnapshot.comparing.includes(index)) return "bg-yellow-400";
    return "bg-text-muted";
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-text-primary">
        Sort Visualizer
      </h2>

      <div className="flex flex-wrap gap-2">
        {algorithms.map((algo) => (
          <Button
            key={algo.value}
            size="sm"
            variant={algorithm === algo.value ? "default" : "outline"}
            onClick={() => setAlgorithm(algo.value)}
            disabled={isPlaying}
          >
            {algo.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Array Size</span>
            <span>{arraySize}</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={arraySize}
            onChange={(e) => setArraySize(Number(e.target.value))}
            disabled={isPlaying}
            className="w-full accent-text-primary"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Speed</span>
            <span>{speed}ms</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-text-primary"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isPlaying ? (
          <Button size="sm" onClick={handlePause}>
            Pause
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} disabled={isComplete}>
            Play
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleStep}
          disabled={isPlaying || isComplete}
        >
          Step
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        {snapshots.length > 0 && (
          <span className="flex items-center text-sm text-text-muted">
            Step {currentStep + 1} / {snapshots.length}
          </span>
        )}
      </div>

      <div className="flex h-64 items-end gap-px rounded border border-border/60 bg-bg-secondary p-2">
        {currentSnapshot.array.map((value, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t transition-all duration-75 ${getBarColor(index)}`}
            style={{ height: `${(value / maxVal) * 100}%` }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-text-muted" />
          Default
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-400" />
          Comparing
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-400" />
          Swapping
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-400" />
          Sorted
        </span>
      </div>
    </div>
  );
}
