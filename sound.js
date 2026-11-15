
import * as Tone from "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm";

const synth = new Tone.Synth().toDestination();

let RGB = crearRGB(255, 2, 0);

function crearRGB(r, g, b) {
    let RGB = {
        r: r,
        g: g,
        b: b
    };

    return RGB;
}

function normalizarRGB(RGBNormalizado) {
    let r = RGBNormalizado.r / 255;
    let g = RGBNormalizado.g / 255;
    let b = RGBNormalizado.b / 255;

    return { r, g, b };
}

function encontrarMaximo(RGB) {
    let maximo = Math.max(RGB.r, RGB.g, RGB.b);
    return maximo;
}

function encontrarMinimo(RGB) {
    let minimo = Math.min(RGB.r, RGB.g, RGB.b);
    return minimo;
}

export async function reproducirSonido() {
    await Tone.start();

    synth.triggerAttackRelease(440, 1);
}

crearRGB(255, 20, 50);
RGB = normalizarRGB(RGB);
