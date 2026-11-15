
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


<<<<<<< HEAD
function calcuarDelta(RGB) {
    let maximo = encontrarMaximo(RGB);
    let minimo = encontrarMinimo(RGB);
    let delta = maximo - minimo;
    return delta;
=======
    synth.triggerAttackRelease(440, 1);
>>>>>>> a73c109cac5359ed21500f3fcd78d83609c8b1a0
}

async function tono(RGB) {

    await Tone.start();

    RGB = crearRGB(222, 54, 67);
    RGB = normalizarRGB(RGB);

    let h = await tono(RGB);
    let frecuencia = convertirHaFrecuencia(h);

    console.log("Hue:", h);
    console.log("Frecuencia:", frecuencia);

    synth.triggerAttackRelease(frecuencia, "8n");
}

function convertirHaFrecuencia(h) {
    let frecuencia = 220 + h/360 * (880 - 220); //si no funca cmabiar a varias octavas
    return frecuencia;
}



function convertirAFrecuencia(h) {
    let nota = Math.floor(2 + h/360 * 12);
    let frecuencia = 220*Math.pow(2,nota/12);  
    return frecuencia;
}

export async function reproducirSonido() {

    await Tone.start();
    RGB = crearRGB(255, 255, 0);
    RGB = normalizarRGB(RGB);
    let h = tono(RGB);
    h= convertirFrecuencia(h);
    let frecuencia = convertirHaFrecuencia(h);
    synth.triggerAttackRelease(frecuencia, 1);
}


