import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import useWebcam from "../customHook/useWebcam";

type IWebcam = {
  capture: () => Promise<string>;
};

type WebcamProps = {
  setPredictScore: (v: number) => void;
};

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
  useEffect(() => {
    const getVideo = async () => {
      try {
        const steam = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = steam;
        }
      } catch (error) {
        console.log(error);
      }
    };

    getVideo();
  }, [videoRef]);
  const width = containerRef.current?.clientWidth;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 100,
        height: width,
        background: "red",
        position: "relative",
      }}
    >
      <div>
       
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            background: "yellow",
            position: "absolute",
            width: width,
            height: width,
          }}
        ></video>
        <canvas
          ref={canvasRef}
          style={{
            background: "green",
            position: "absolute",
            width: width,
            height: width,
          }}
        ></canvas>
        {renderLoading()}
        {renderBackgroundBox()}
        {renderError()}
      </div>
      <button
          onClick={() => handleTakePhoto()}
          style={{
            display: "block",
            position:'relative',
            zIndex: "10",
            width: "100px",
            height: "30px",
            marginTop: "100px",
            background: "pink",
          }}
        >
          {" "}
          capture
        </button>
    </div>
  );
});

export default Webcam;
