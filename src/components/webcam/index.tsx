import { forwardRef, useImperativeHandle, useRef } from "react";
import useWebcam from "../customHook/useWebcam";

type IWebcam = {
  capture: () => Promise<string>;
};

type WebcamProps = {
  setPredictScore: (v: number) => void;
};
// export type IWebCam = {
//     captucre: () => Promise<string>;
//   };

//   export type WebCamProps = {
//     setPredictScore: (v: number) => void;
//   };

const Webcam = forwardRef<IWebcam, WebcamProps>(({ setPredictScore }, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { handleTakePhoto, renderLoading, renderBackgroundBox, renderError } =
    useWebcam(videoRef, canvasRef, (score: number) => setPredictScore(score));

  useImperativeHandle(
    ref,
    () => ({
      capture: handleTakePhoto,
    }),
    [handleTakePhoto]
  );

  const width = containerRef.current?.clientWidth;

  return (
    <div
      ref={containerRef}
      style={{ minHeight: 500, height: width, background: "red" }}
    >
      <video
        ref={videoRef}
        autoPlay={false}
        playsInline
        style={{ background: "pink", width: width, height: width }}
      ></video>
      <canvas ref={canvasRef}></canvas>
      {renderLoading()}
      {renderBackgroundBox()}
      {renderError()}
      <button onClick={() => handleTakePhoto()}> capture</button>
    </div>
  );
});

export default Webcam;
