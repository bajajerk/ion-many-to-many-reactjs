import React, {useEffect, useRef, useState} from 'react';
import {Client, LocalStream} from 'ion-sdk-js';
import {IonSFUJSONRPCSignal} from 'ion-sdk-js/lib/signal/json-rpc-impl';
import {Grid} from "@material-ui/core";

let client, signal;

const App = () => {
    const [remoteStream, setRemoteStream] = useState([]);
    const [trackIds, setTrackIds] = useState([]);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [pubShow, setPubShow] = useState('hidden');
    const pubVideo = useRef();
    const remoteVideoRef = useRef([]);
    // const subVideo = useRef();
    const tracks = useRef([]);


    console.log(remoteStream)

    const config = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
        codec: 'h264',
    };

    const startStream = () => {
        signal = new IonSFUJSONRPCSignal("wss://sfu.collablens.in/ws");
        client = new Client(signal, config);
        signal.onopen = () => client.join("test room");

        // if (!isPub) {
        client.ontrack = (track, stream) => {
            console.log("got track: ", track.id, track.kind, "for stream: ", stream.id);
            if (track.kind === 'video') {
                track.onunmute = () => {
                    // trackIDs.current = trackIds.current.push(track.id)
                    setTrackIds(trackIds => [...trackIds, track.id])
                    setRemoteStream(remoteStream => [...remoteStream, {id: track.id, stream: stream, autoplay: true}]);
                    setCurrentVideo(track.id);
                    // subVideo.current.srcObject = stream;
                    // subVideo.current.autoplay = true;
                    // subVideo.current.muted = false;

                    stream.onremovetrack = (e) => {
                        // subVideo.current.srcObject = null;
                        setRemoteStream(remoteStream => remoteStream.filter(item => item.id !== e.track.id));
                    }
                }
            }

        }

    }

    useEffect(() => {
        // startStream();
        // }
    }, []);

    useEffect(() => {
        const videoEl = remoteVideoRef.current[currentVideo];
        // let stream;
        console.log(videoEl)
        remoteStream.map((ev) => {
            if (ev.id === currentVideo) {
                videoEl.srcObject = ev.stream;
                videoEl.autoplay = true;

            }
        })
    }, [currentVideo]);

    const start = (event) => {

        if (event) {
            LocalStream.getUserMedia({
                resolution: 'qhd',
                audio: true,
                // video: false,
                codec: "vp8"
            }).then((media) => {
                pubVideo.current.srcObject = media;
                pubVideo.current.autoplay = true;
                pubVideo.current.controls = true;
                pubVideo.current.muted = true;
                setPubShow('block');
                client.publish(media);
            }).catch(console.error);
        } else {
            LocalStream.getDisplayMedia({
                resolution: 'qhd',
                video: true,
                audio: true,
                // video: { width: 1280, height: 720 },
                codec: "h264"
            }).then((media) => {
                pubVideo.current.srcObject = media;
                pubVideo.current.autoplay = true;
                pubVideo.current.controls = true;
                pubVideo.current.muted = true;
                setPubShow('block');
                client.publish(media);
            }).catch(console.error);
        }
    }


    const removeDuplicateStreams = (streams) => {
        let uniqueStreamsIds = []
        let uniqueStreams = [];

        // eslint-disable-next-line array-callback-return
        streams.map(stream => {
            console.log(uniqueStreamsIds, stream.stream.id)
            if (uniqueStreamsIds.indexOf(stream.stream.id) === -1) {
                uniqueStreams.push(stream)
                uniqueStreamsIds.push(stream.stream.id);
            }
        })
        console.log(uniqueStreamsIds, uniqueStreams)
        return uniqueStreams;
    }


    const publishVideo = (pubShow, pubVideo, height, width) => {
        return <video className={`bg-black ${pubShow}`} controls ref={pubVideo} width={width} height={height}></video>
    }

    const subscribedVideo = (val, index, height, width) => {
        return (
            <div>
                <video key={index} ref={(el) => remoteVideoRef.current[val.id] = el}
                       className="bg-black" width={width} height={height} controls
                       autoPlay></video>
            </div>
        )
    }


    const videoGrid = (pubShow, pubVideo, remoteStream) => {
        console.log(pubVideo.current?.srcObject)
        const isPublishVideoAvailable = (pubVideo.current && pubVideo.current?.srcObject) !== null;
        console.log(isPublishVideoAvailable)
        const totalSteams = removeDuplicateStreams(remoteStream).length + (isPublishVideoAvailable ? 1 : 0);
        console.log("total streams are", totalSteams)
        const widthProportion = totalSteams > 1 ? .5 : 1;
        return (
            <div style={{display: 'flex', flexDirection: 'row'}}>

                    {publishVideo(pubShow, pubVideo, window.innerHeight *  widthProportion, window.innerWidth * widthProportion)}
                    {removeDuplicateStreams(remoteStream).map((val, index) => {
                        return (
                            subscribedVideo(val, index, window.innerHeight *  widthProportion, window.innerWidth * widthProportion)
                        )
                    })}
                </div>

                //
                // {totalSteams > 1 &&
                // <div>
                //     {/*<div>*/}
                //     {/*    {publishVideo(pubShow, pubVideo, window.innerHeight  * widthProportion, window.innerWidth * widthProportion)}*/}
                //     {/*</div>*/}
                //     {removeDuplicateStreams(remoteStream).map((val, index) => {
                //         return (
                //             <>
                //                 <p> new video </p>
                //                 {subscribedVideo(val, index, window.innerHeight  * widthProportion, window.innerWidth * widthProportion)}
                //             </>
                //         )
                //     })}
                // </div>
                // }


            // </>
        )
    }
    return (
        <div className="flex flex-col h-screen relative">
            <header className="flex h-16 justify-center items-center text-xl bg-black text-white">
                <div>ion-sfu</div>
                <div className="absolute top-2 right-5">
                    <button  className="bg-blue-500 px-4 py-2 text-white rounded-lg mr-5"
                            onClick={() => startStream()}>Start stream Camera
                    </button>
                    <button id="bnt_pubcam" className="bg-blue-500 px-4 py-2 text-white rounded-lg mr-5"
                            onClick={() => start(true)}>Publish Camera
                    </button>
                    {/*<button id="bnt_pubscreen" className="bg-green-500 px-4 py-2 text-white rounded-lg"*/}
                    {/*        onClick={() => start(false)}>Publish Screen*/}
                    {/*</button>*/}
                </div>
            </header>
            <div>
                {videoGrid(pubShow, pubVideo, remoteStream)}
                {/*<video className={`bg-black h-full w-full ${pubShow}`} controls ref={pubVideo}></video>*/}
                {/*{removeDuplicateStreams(remoteStream).map((val, index) => {*/}
                {/*    return (*/}
                {/*        <video key={index} ref={(el) => remoteVideoRef.current[val.id] = el}*/}
                {/*               className="bg-black" width={window.innerWidth*.5} height={window.innerHeight*.5}  controls autoPlay></video>*/}
                {/*    )*/}
                {/*})}*/}
            </div>
        </div>
    );
}

export default App;
