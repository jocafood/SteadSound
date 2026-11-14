import * as Tone from 'tone';

const synth = new Tone.Synth().toDestination();
document.getElementById("sonido").addEventListener("click", function() {
    reproducirSonido();
    
});

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



async function reproducirSonido() {

    await Tone.start();

    synth.triggerAttackRelease(440, "8n");

}

crearRGB(255, 20, 50);
RGB = normalizarRGB(RGB);
console.log(RGB);



