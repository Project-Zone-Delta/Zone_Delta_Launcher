const axios = require('axios');

let interval;

const radio = new Audio('http://radio.zone-delta.xyz/listen/zone_delta/radio.mp3');

const homeRadioButton = document.getElementsByClassName('radio-home-button')?.[0];

/**
 * @type {HTMLImageElement | undefined}
 */
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

    homeRadioButton.onclick = () => {
        switchView(getCurrentView(), VIEWS.landing);
    };
}

/**
 * @param {SVGElement} playButton
 * @param {SVGElement} pauseButton
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
        document.documentElement.style.setProperty('--url-radio', `url('${data.now_playing.song.art}')`);
    }

    radioTitle.textContent = data?.now_playing?.song?.title;
}

radioImage.onload = () => {
    const { r, g, b } = getColorAverage();
    if (r*0.299 + g*0.587 + b*0.114 > 120) {
        document.documentElement.style.setProperty('--button-bg-color', '#000');
        document.documentElement.style.setProperty('--button-fg-color', '#fff');
    } else {
        document.documentElement.style.setProperty('--button-bg-color', '#fff');
        document.documentElement.style.setProperty('--button-fg-color', '#000');
    }
};


/**
 * Author: pioupia (https://github.com/pioupia)
 * Made the 13th of May 2023
 * Licence: creative common. Need to be credited
 */

/**
 * Get the color average under the "home" button
 * @return {{r: number, g: number, b: number}}
 */
function getColorAverage() {
    const canvas = document.createElement('canvas');
    canvas.height = radioImage.naturalHeight || radioImage.offsetHeight || radioImage.height;
    canvas.height = radioImage.naturalWidth || radioImage.offsetWidth || radioImage.width;

    const ctx = canvas.getContext('2d');

    const defaultLayers = {
        r: 0,
        g: 0,
        b: 0
    };

    ctx.drawImage(radioImage, 0, 0);

    try {
        const midWidth = Math.floor(canvas.width / 4);
        const midHeight = Math.floor(canvas.height / 2);

        const data = ctx.getImageData(midWidth, midHeight, canvas.width - midWidth, canvas.height - Math.floor(midHeight / 2));
        const len = data.data.length;

        for (let i = 0; i < len; i += 4) {
            defaultLayers.r += data.data[i];
            defaultLayers.g += data.data[i+1];
            defaultLayers.b += data.data[i+2];
        }

        const pixelCount = Math.floor(len / 4);
        defaultLayers.r /= pixelCount;
        defaultLayers.g /= pixelCount;
        defaultLayers.b /= pixelCount;

    } catch(_) { /* empty */ }

    return defaultLayers;
}