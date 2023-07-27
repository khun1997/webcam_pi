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
  onReadyCallback?: (score: number) => void
) => {
  const [isReady, setIsReady] = useState<boolean>(true);
  const [isPermit, setIsPermit] = useState<boolean>(true);

  const getVideoAndCanvas = () => {
    const { current: video } = videoRef;
    const { current: canvas } = canvasRef;

    return { video, canvas };
  };

  const handleTakePhoto = () =>
    new Promise<string>((resolve) => {
      console.log("capture");
      const { video, canvas } = getVideoAndCanvas();

      if (!video || !canvas) {
        resolve("");
        console.log("no everyting");
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        resolve("");
        console.log("no context");
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
      console.log("render loading");
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
      console.log("render error");

      return (
        <div
          style={{
            position: "absolute",
            display: "flex",
            left: 0,
            // right:0,
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
              gap: 3,
              flexDirection: "column",
            }}
          >
            <p>camera's access is denied</p>
            <a href={window.location.href}>reload page</a>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBackgroundBox = () => {
    console.log("render background");
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

   // useEffect(() => {
  //   const getVideo = async () => {
  //     try {
  //       const steam = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //       });

  //       if (videoRef.current) {
  //         videoRef.current.srcObject = steam;
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   getVideo();
  // }, [videoRef]);

  const setupCameraAndCheck = async () => {
    const { video } = getVideoAndCanvas();
    await new Promise((r) => {
      setTimeout(() => {
        r(null);
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
      if (videoRef.current) {
        videoRef.current.srcObject = steam;
      }
      const vdoTrack = steam.getVideoTracks().find((v, i) => i === 0);
      if (!vdoTrack) return;
      //   navigator.mediaDevices.getSupportedConstraints.
      //   if(!vdoTrack.getCapabilities.focusMode){

      // vdoTrack.applyConstraints({focusMode: 'manual', focusDistance: 0.33})
      // vdoTrack.applyConstraints({focusMode:'manual'})
      //   }
      const focusModeCapability = vdoTrack.getCapabilities();
      if (!focusModeCapability) {
        video.srcObject = steam;
        track = vdoTrack;
        break;
      } else {
        vdoTrack.stop();
      }
    }
  };

 
  useEffect(() => {
    onLoading();
  }, [videoRef]);

  useEffect(() => {
    if (videoRef.current) {
      askCamPermission(() => setupCameraAndCheck());
    }
  }, []);


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
