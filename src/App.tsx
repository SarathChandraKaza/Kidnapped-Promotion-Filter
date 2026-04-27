import { useState, useCallback } from "react";
import { LandingPage } from "@/pages/LandingPage";
import { CameraView } from "@/pages/CameraView";
import { PreviewPage } from "@/pages/PreviewPage";
import { PermissionError } from "@/pages/PermissionError";
import { analytics } from "@/analytics"; // ← ADD THIS

type Screen = "landing" | "camera" | "preview" | "error";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [capturedImage, setCapturedImage] = useState<string>("");

  const handleStart = useCallback(() => {
    setScreen("camera");
  }, []);

  const handleCapture = useCallback((imageDataUrl: string) => {
    analytics.trackCapture(); // ← TRACK
    setCapturedImage(imageDataUrl);
    setScreen("preview");
  }, []);

  const handleError = useCallback(() => {
    setScreen("error");
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage("");
    setScreen("camera");
  }, []);

  const handleRetry = useCallback(() => {
    setScreen("landing");
  }, []);

  return (
    <>
      {screen === "landing" && <LandingPage onStart={handleStart} />}
      {screen === "camera" && (
        <CameraView onCapture={handleCapture} onError={handleError} />
      )}
      {screen === "preview" && capturedImage && (
        <PreviewPage imageDataUrl={capturedImage} onRetake={handleRetake} />
      )}
      {screen === "error" && <PermissionError onRetry={handleRetry} />}
    </>
  );
}
