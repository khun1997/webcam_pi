import { MutableRefObject, useEffect, useState } from "react";
import useResizeCanvas from "./useResizeCanvas";

let track: MediaStreamTrack | undefined;

const stopTrack = () => {
  if (track) {
    track.stop();
    track = undefined;
  }
};
const useWebcam = (
  videoRef: MutableRefObject<HTMLVideoElement | null>,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  onReadyCallback: (score: number) => void
) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPermit, setIsPermit] = useState<boolean>(false);

  const getVideoAndCanvas = () => {
    const { current: video } = videoRef;
    const { current: canvas } = canvasRef;

    return { video, canvas };
  };

  const handleTakePhoto = () =>
    new Promise<string>((resolve) => {
      const { video, canvas } = getVideoAndCanvas();

      if (!track || !video || !canvas) {
        resolve("");
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        resolve("");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (onReadyCallback) onReadyCallback(0);

      if (video.videoWidth > video.videoHeight)
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      else {
        const sWidth = video.videoWidth;
        const sHeight = sWidth;
        const sy = (video.videoHeight - sHeight) / 2;

        canvas.width = sWidth;
        canvas.height = sHeight;
        context.drawImage(
          video,
          0,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
      canvas.style.opacity = "1";
      setIsReady(false);
      setTimeout(() => {
        const targetWidth = 640;
        const lowQualityCanvas = useResizeCanvas(
          canvas,
          canvas.width > targetWidth ? canvas.width : targetWidth
        );

        if (!lowQualityCanvas) {
          stopTrack();
          resolve("");
          return;
        }

        const capturedImageString = lowQualityCanvas.toDataURL("image/png");
        resolve(capturedImageString);
        stopTrack();
      }, 1000);
    });
  const onLoading = () => {
    const { video, canvas } = getVideoAndCanvas();
    if (!video || !canvas) return;
    video.onloadeddata = () => {
      video.play();
      video.style.opacity = "1";
      setIsReady(true);

      if (onReadyCallback) onReadyCallback(1);
    };
  };

  const askCamPermission = (onSuccess: () => any) => {
    navigator.mediaDevices.enumerateDevices().then((ds) => {
      const notAllowedDevice = ds.find((d) => !d.deviceId);
      if (!notAllowedDevice) {
        onSuccess();
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: true,
        })
        .then((steam) => {
          const videoSteam = steam.getVideoTracks();
          if (videoSteam.length > 0) {
            videoSteam[0].stop();
            setTimeout(() => {
              onSuccess();
            }, 300);
          }
        })
        .catch(() => setIsPermit(true));
    });
  };

  const renderLoading = () => {
    if (!isReady && !isPermit) {
      return (
        <h1
          style={{
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          loading
        </h1>
      );
    }
    return null;
  };

  const renderError = () => {
    if (!isReady && isPermit) {
      <div
        style={{
          position: "absolute",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "yellow",
        }}
      >
        <div
          style={{
            width: "full",
            height: "full",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <p>camera's access is denied</p>
          <a href={window.location.href}>reload page</a>
        </div>
        ;
      </div>;
    }
    return null;
  };

  const renderBackgroundBox = () => {
    if (isReady) {
      return (
        <div
          style={{
            width: "full",
            height: "full",
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "green",
          }}
        >
          <div></div>
        </div>
      );
    }
  };

  const setupCameraAndCheck = async () => {
    const { video } = getVideoAndCanvas();
    await new Promise((re) => {
      setTimeout(() => {
        re(null);
      }, 100);
    });

    if (!video) return alert("camera is not ready !");
    if (!navigator.mediaDevices.enumerateDevices)
      return alert("Your device is not supported !");

    const devicesInfo = await navigator.mediaDevices.enumerateDevices();

    const targetDevicesInfo = devicesInfo
      .filter((vdo) => vdo.kind === "videoinput")
      .filter((vdo) => vdo.label.toLocaleLowerCase().includes("front"));

    for (const deviceInfo of targetDevicesInfo) {
      const steam = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: deviceInfo.deviceId,
          width: { ideal: 1920 },
        },
      });
        const vdoTrack = steam.getVideoTracks().find((v, i) => i === 0);
        if (!vdoTrack) return;
        //   navigator.mediaDevices.getSupportedConstraints.
        //   if(!vdoTrack.getCapabilities.focusMode){

        vdoTrack.applyConstraints({ advanced: [{ focusMode: "manual" }] });
        // vdoTrack.applyConstraints({focusMode:'manual'})

        //   }
        const focusModeCapability = vdoTrack.getCapabilities().focusMode;
        if (!focusModeCapability) {
          video.srcObject = steam;
          track = vdoTrack;
          break;
        } else if (focusModeCapability.includes("continuous")) {
          video.srcObject = steam;
          track = vdoTrack;
          break;
        } else {
          vdoTrack.stop();
        }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      askCamPermission(() => setupCameraAndCheck());
    }
  }, []);

  useEffect(() => {
    onLoading();
  }, [setIsReady, videoRef]);

  return {
    stopTrack,
    getVideoAndCanvas,
    handleTakePhoto,
    onLoading,
    askCamPermission,
    renderLoading,
    renderError,
    renderBackgroundBox,
    setupCameraAndCheck,
  };
};

export default useWebcam;
