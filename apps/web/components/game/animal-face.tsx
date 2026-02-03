"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimalIcon, UIIcon, type AnimalType } from "@/components/ui/icons";

// @teachablemachine/image 타입 (내부 사용)
interface TMWebcam {
  setup(options?: { facingMode?: string }): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  update(): void;
  canvas: HTMLCanvasElement;
  webcam: HTMLVideoElement;
}

interface TMModel {
  predict(
    input: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
  ): Promise<{ className: string; probability: number }[]>;
  getTotalClasses(): number;
}

// 프로젝트 표준 easing
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

// 모델 URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/V9poYecHi/";

// 동물상 데이터
interface AnimalInfo {
  icon: AnimalType;
  name: string;
  description: string;
}

const ANIMAL_INFO: Record<string, AnimalInfo> = {
  dog: {
    icon: "dog",
    name: "강아지상",
    description:
      "충성스럽고 활발한 에너지! 사교적이고 따뜻한 성격으로 주변 사람들에게 사랑받는 타입",
  },
  cat: {
    icon: "cat",
    name: "고양이상",
    description:
      "독립적이고 신비로운 매력! 차분하고 우아한 분위기로 자신만의 세계가 확실한 타입",
  },
  fox: {
    icon: "fox",
    name: "여우상",
    description:
      "영리하고 매력적인 인상! 날카로운 관찰력과 재치로 사람들의 시선을 사로잡는 타입",
  },
};

// Phase 타입
type Phase = "idle" | "loading" | "camera" | "preview" | "analyzing" | "result";

// 입력 소스 타입
type InputSource = "camera" | "upload";

// 예측 결과 타입
interface Prediction {
  className: string;
  probability: number;
}

interface AnimalResult {
  animal: string;
  confidence: number;
  allPredictions: Prediction[];
}

// 히스토리 타입
interface HistoryItem {
  id: number;
  animal: string;
  icon: AnimalType;
  name: string;
  confidence: number;
}

// 신뢰도 바 컴포넌트
function ConfidenceBar({
  label,
  icon,
  value,
  delay,
}: {
  label: string;
  icon: AnimalType;
  value: number;
  delay: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-6 justify-center">
        <AnimalIcon animal={icon} className="h-5 w-5" />
      </span>
      <span className="w-20 text-sm text-text-secondary">{label}</span>
      <div className="h-2 flex-1 overflow-hidden bg-border/30">
        <motion.div
          className="h-full bg-text"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ duration: 0.8, delay, ease: EASING }}
        />
      </div>
      <span className="w-12 text-right text-sm font-bold">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function AnimalFaceGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [result, setResult] = useState<AnimalResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const modelRef = useRef<TMModel | null>(null);
  const webcamRef = useRef<TMWebcam | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // 리소스 정리
  const cleanup = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);

    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 에러 처리
  const handleError = useCallback(
    (err: unknown, customMessage?: string) => {
      const error = err instanceof Error ? err : new Error(String(err));

      if (customMessage) {
        setError(customMessage);
      } else if (error.name === "NotAllowedError") {
        setError(
          "카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "NotReadableError"
      ) {
        setError(
          "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요."
        );
      } else {
        setError(
          "AI 모델을 불러오는데 실패했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요."
        );
      }

      cleanup();
      setPhase("idle");
      setInputSource(null);
    },
    [cleanup]
  );

  // 모델 로딩 (별도)
  const loadModel = useCallback(async () => {
    if (modelRef.current) return true;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tmImage = (await import("@teachablemachine/image")) as any;
      const model = await tmImage.load(
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
      );
      modelRef.current = model as TMModel;
      setModelLoaded(true);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, [handleError]);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setInputSource("camera");
    setUploadedImage(null);

    try {
      // 모델 로딩
      const modelOk = await loadModel();
      if (!modelOk) return;

      // 네이티브 getUserMedia 사용 (더 안정적)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 300, height: 300 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setPhase("camera");
        };
      }
    } catch (err) {
      handleError(err);
    }
  }, [loadModel, handleError]);

  // 파일 처리
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      setPhase("loading");
      setError(null);
      setInputSource("upload");
      cleanup();

      try {
        // 모델 로딩
        const modelOk = await loadModel();
        if (!modelOk) return;

        // 이미지 로드
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImage(result);
          setPhase("preview");
        };
        reader.onerror = () => {
          handleError(new Error("FileReadError"), "파일을 읽는데 실패했습니다.");
        };
        reader.readAsDataURL(file);
      } catch (err) {
        handleError(err);
      }
    },
    [loadModel, handleError, cleanup]
  );

  // 파일 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // 같은 파일 재선택 허용
      e.target.value = "";
    },
    [handleFile]
  );

  // 드래그 앤 드롭
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  // 카메라 촬영
  const captureFromCamera = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) return;

    setPhase("analyzing");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // 비디오를 캔버스에 그리기 (미러 효과)
    canvas.width = video.videoWidth || 300;
    canvas.height = video.videoHeight || 300;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const predictions = await modelRef.current.predict(canvas);
      processResult(predictions);
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setPhase("camera");
    }
  }, []);

  // 업로드 이미지 분석
  const analyzeUploadedImage = useCallback(async () => {
    if (!modelRef.current || !uploadedImageRef.current) return;

    setPhase("analyzing");

    try {
      const predictions = await modelRef.current.predict(uploadedImageRef.current);
      processResult(predictions);
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setPhase("preview");
    }
  }, []);

  // 결과 처리
  const processResult = (predictions: Prediction[]) => {
    const sorted = [...predictions].sort(
      (a: Prediction, b: Prediction) => b.probability - a.probability
    );
    const top = sorted[0];

    const newResult: AnimalResult = {
      animal: top.className,
      confidence: top.probability,
      allPredictions: predictions,
    };

    setResult(newResult);

    const info = ANIMAL_INFO[top.className];
    setHistory((prev) => [
      {
        id: prev.length + 1,
        animal: top.className,
        icon: info?.icon ?? "dog",
        name: info?.name ?? top.className,
        confidence: top.probability,
      },
      ...prev.slice(0, 9),
    ]);

    setPhase("result");
  };

  // 다시 시작
  const restart = useCallback(() => {
    cleanup();
    setResult(null);
    setUploadedImage(null);
    setInputSource(null);
    setPhase("idle");
  }, [cleanup]);

  // 카메라로 다시 촬영
  const retryCamera = useCallback(() => {
    setPhase("camera");
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const resultInfo = result ? ANIMAL_INFO[result.animal] : null;

  return (
    <div className="flex flex-col items-center">
      {/* 숨겨진 input과 canvas */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* 비디오 요소 (카메라 모드에서만 표시) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`aspect-square w-[300px] max-w-full border border-border/60 object-cover ${
          phase === "camera" ? "block" : "hidden"
        }`}
        style={{ transform: "scaleX(-1)" }}
      />

      <AnimatePresence mode="wait">
        {/* idle 상태 */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ ease: EASING }}
            className="flex flex-col items-center"
          >
            <div className="flex gap-4">
              <AnimalIcon animal="dog" className="h-10 w-10" />
              <AnimalIcon animal="cat" className="h-10 w-10" />
              <AnimalIcon animal="fox" className="h-10 w-10" />
            </div>
            <p className="mt-6 max-w-xs text-center text-sm text-text-secondary">
              AI가 당신의 얼굴을 분석하여
              <br />
              어떤 동물과 닮았는지 알려드려요!
            </p>

            {/* 드래그 앤 드롭 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-8 flex h-40 w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-text bg-bg-secondary"
                  : "border-border/60 hover:border-text/50 hover:bg-bg-secondary/50"
              }`}
            >
              <UIIcon icon="camera" className="h-8 w-8 text-text-muted" />
              <p className="mt-2 text-sm text-text-secondary">
                사진을 드래그하거나 클릭하여 업로드
              </p>
              <p className="mt-1 text-xs text-text-muted">
                사진은 저장되지 않습니다
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="h-px w-12 bg-border/60" />
              <span className="text-xs text-text-muted">또는</span>
              <div className="h-px w-12 bg-border/60" />
            </div>

            <Button onClick={startCamera} size="lg" className="mt-4">
              <UIIcon icon="video" className="mr-2 h-4 w-4" />
              카메라로 촬영
            </Button>
          </motion.div>
        )}

        {/* loading 상태 */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex h-[300px] w-[300px] flex-col items-center justify-center border border-border/60 bg-bg-secondary"
            >
              <UIIcon icon="robot" className="h-10 w-10 text-text-muted" />
              <p className="mt-4 text-sm text-text-muted">
                {modelLoaded ? "준비중..." : "AI 모델을 로딩중..."}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* camera 상태 - 버튼만 표시 (비디오는 위에서 별도 렌더링) */}
        {phase === "camera" && (
          <motion.div
            key="camera-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="mt-8 flex gap-4">
              <Button onClick={captureFromCamera} size="lg">
                <UIIcon icon="capture" className="mr-2 h-4 w-4" />
                촬영하기
              </Button>
              <Button onClick={restart} size="lg" variant="outline">
                취소
              </Button>
            </div>
          </motion.div>
        )}

        {/* preview 상태 (업로드된 이미지) */}
        {phase === "preview" && uploadedImage && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: EASING }}
            className="flex flex-col items-center"
          >
            <div className="aspect-square w-[300px] max-w-full overflow-hidden border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={uploadedImageRef}
                src={uploadedImage}
                alt="업로드된 이미지"
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
            <div className="mt-8 flex gap-4">
              <Button onClick={analyzeUploadedImage} size="lg">
                <UIIcon icon="search" className="mr-2 h-4 w-4" />
                분석하기
              </Button>
              <Button onClick={restart} size="lg" variant="outline">
                다른 사진
              </Button>
            </div>
          </motion.div>
        )}

        {/* analyzing 상태 */}
        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {uploadedImage ? (
              <div className="aspect-square w-[300px] max-w-full overflow-hidden border border-border/60 opacity-70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="분석중"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[300px] w-[300px] items-center justify-center border border-border/60 bg-bg-secondary opacity-70">
                <UIIcon icon="capture" className="h-10 w-10 text-text-muted" />
              </div>
            )}
            <div className="mt-6 flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-text border-t-transparent"
              />
              <span className="text-sm text-text-muted">분석중...</span>
            </div>
          </motion.div>
        )}

        {/* result 상태 */}
        {phase === "result" && result && resultInfo && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full max-w-xs flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: EASING }}
            >
              <AnimalIcon animal={resultInfo.icon} className="h-20 w-20" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ease: EASING }}
              className="mt-4 text-2xl font-bold"
            >
              {resultInfo.name}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 w-full space-y-3"
            >
              {result.allPredictions
                .sort((a, b) => b.probability - a.probability)
                .map((pred, i) => {
                  const info = ANIMAL_INFO[pred.className];
                  return (
                    <ConfidenceBar
                      key={pred.className}
                      icon={info?.icon ?? "dog"}
                      label={info?.name ?? pred.className}
                      value={pred.probability}
                      delay={0.3 + i * 0.1}
                    />
                  );
                })}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, ease: EASING }}
              className="mt-6 text-center text-sm text-text-secondary"
            >
              {resultInfo.description}
            </motion.p>

            <div className="mt-8 flex gap-4">
              <Button onClick={restart} size="lg">
                다시 하기
              </Button>
              {inputSource === "camera" && (
                <Button onClick={retryCamera} size="lg" variant="outline">
                  다시 촬영
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 오버레이 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 flex flex-col items-center rounded border border-border/60 bg-bg-secondary p-6"
          >
            <UIIcon icon="warning" className="h-8 w-8 text-yellow-500" />
            <p className="mt-3 max-w-xs text-center text-sm text-text-secondary">
              {error}
            </p>
            <Button
              onClick={() => {
                setError(null);
                restart();
              }}
              size="lg"
              className="mt-4"
            >
              다시 시도
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 히스토리 */}
      {history.length > 0 && (
        <div className="mt-12 w-full max-w-xs">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            History
          </p>
          <div className="mt-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm"
              >
                <span className="text-text-muted">#{item.id}</span>
                <span className="flex items-center gap-2">
                  <AnimalIcon animal={item.icon} className="h-5 w-5" />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold">
                  {Math.round(item.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
