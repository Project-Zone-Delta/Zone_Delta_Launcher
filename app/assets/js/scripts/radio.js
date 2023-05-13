const axios = require('axios');

let nowPlaying, nowPlayingTimeout, interval;

const radio = new Audio('http://radio.zone-delta.xyz/listen/zone_delta/radio.mp3');

const radioImage = document.getElementsByClassName('musique-img')?.[0];
const radioTitle = document.getElementsByClassName('musique-title')?.[0];
const authorName = document.getElementsByClassName('author-title')?.[0];
const albumTitle = document.getElementsByClassName('album-title')?.[0];

function loadRadio() {
    initBtn();
    loadNowPlaying();

    if (!interval) {
        interval = setInterval(() => {
            if (!radio.paused) loadNowPlaying();
        }, 15_000);
    }
}

/**
 * @param {SVGElement} playButton
 * @param {SVGElement} pauseButton
 * @param {HTMLAudioElement} radio
 * @return {void}
 */
function toggleButtons(playButton, pauseButton) {
    playButton.classList.toggle('hidden');
    pauseButton.classList.toggle('hidden');

    if (radio.paused) {
        radio.load();
        radio.play();
    } else {
        radio.pause();
    }
}

function initBtn() {
    const playButton = document.getElementsByClassName('play')?.[0];
    const pauseButton = document.getElementsByClassName('pause')?.[0];

    const btnCb = () => toggleButtons(playButton, pauseButton);

    if (playButton) playButton.onclick = btnCb;
    if (pauseButton) pauseButton.onclick = btnCb;


    const progressBar = document.getElementById('progress-bar');
    const volumeText = document.getElementsByClassName('slider-value')?.[0];
    const volumeBar = document.getElementsByClassName('volume-bar')?.[0];

    if (!volumeBar || !volumeText || !progressBar) return;

    volumeBar.oninput = () => {
        progressBar.setAttribute('value', volumeBar.value);
        volumeText.textContent = volumeBar.value + '%';

        radio.volume = +volumeBar.value / 100;
    };
}

async function loadNowPlaying() {
    const res = await axios.get('http://45.154.96.199:83/api/nowplaying/1').catch(console.error);

    if (!res) return;

    const { data } = res;

    if (data?.live?.is_live) {
        authorName.textContent = `Streamer : ${data.live.streamer_name}`;
    }

    if (data?.now_playing?.song) {
        albumTitle.textContent = data.now_playing.song.artist;
        radioImage.src = data.now_playing.song.art;
    }

    radioTitle.textContent = data?.now_playing?.song?.title;
}