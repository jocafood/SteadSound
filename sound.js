
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


function calcularHue(RGB) {
    let maximo = encontrarMaximo(RGB);
    let minimo = encontrarMinimo(RGB);
    let delta = maximo-minimo;
    let h = 0;
    if (delta == 0) {
        h = 0;
    }
    else if (maximo == RGB.r) {
        h = 60 * (((RGB.g - RGB.b) / delta) % 6);
    }
    else if (maximo == RGB.g) {
        h = 60 * (((RGB.b - RGB.r) / delta) + 2);
    }
    else if (maximo == RGB.b) {
        h = 60 * (((RGB.r - RGB.g) / delta) + 4);
    }
    if (h < 0) {
        h += 360;
    }
    return h;
}

function convertirHaFrecuencia(h) {
    let nota = Math.floor(2 + h/360 * 12);
    let frecuencia = 220*Math.pow(2,nota/12);  
    return frecuencia;
}

export async function reproducirSonido() {
    await Tone.start();
    RGB = crearRGB(255, 0, 0);
    RGB = normalizarRGB(RGB);
    let h = calcularHue(RGB);
    let frecuencia = convertirHaFrecuencia(h);
    synth.triggerAttackRelease(frecuencia, 1);
}


