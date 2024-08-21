import * as THREE from 'three';
import { OrbitControls, ThreeMFLoader } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui';


const scene = new THREE.Scene();
scene.background = new THREE.Color('lightblue');





const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );




const renderer = new THREE.WebGLRenderer();


renderer.shadowMap.enabled = true;


renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


// Gives the user the ability to control the camera
const orbit = new OrbitControls(camera, renderer.domElement)

// MAkes all of the cubes in the project
class BOX extends THREE.Mesh {
   
    constructor({width, height, depth, color = '#0000FF', velocity = {
        x: 0,
        y: 0,
        z: 0
    },
    position = {
        x: 0,
        y: 0,
        z: 0
    }
    }) {
        super(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial( { color } )
    );
        this.height = height;
        this.depth = depth;
        this.width = width;


        this.position.set(position.x, position.y, position.z);


        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;


        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height/2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;


        this.velocity = velocity;
        this.gravity = -0.001;
       
    }


    updateSides(){
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;
       
        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;


        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
    }


    update(floor){
        this.updateSides();


        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;
        
        this.applyGravity(floor);
    }

    applyGravity(floor){
        this.velocity.y += this.gravity;

        if (boxCollision({
              box1: this,
              box2: floor
            })) {
            this.velocity.y *= 0.4;
            this.velocity.y = -this.velocity.y;
          } else this.position.y += this.velocity.y;
        }
}

// Check to see  if two boces hit together
function boxCollision({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
    const zCollision = box1.front >= box2.back && box1.back <= box2.front

    return xCollision && yCollision && zCollision
  }

// Makes the moveable cube
const cube = new BOX({
    depth: 1.25,
    width: 1.25,
    height: 1.25,
    velocity: {
        x: 0,
        y: -0.01,
        z: 0
    },
});


scene.add(cube);
cube.castShadow = true;

// Makes the floor object
const floor = new BOX({
    width: 40,
    height: 0.1,
    depth: 40,
    color: 'green',
    position: {
        x: 0,
        y: -2,
        z: 0,
    }
});


scene.add(floor);
floor.receiveShadow = true;

const sphere = new THREE.SphereGeometry(6);
const sphereMat = new THREE.MeshStandardMaterial({color: 'Yellow'});
const sun = new THREE.Mesh(sphere, sphereMat);
scene.add(sun);
sun.position.x = -38;
sun.position.y = 60;

// Add the fog to the scene 
scene.fog = new THREE.Fog('white', 1, 100);

camera.position.z = 5;
orbit.update();

// Add the Ambient Lighting
const ambientLight = new THREE.AmbientLight('white');
scene.add(ambientLight);

// Add the directional light
const directionalLight = new THREE.DirectionalLight('0xFFFFFF', 0.8);
scene.add(directionalLight);
directionalLight.position.set(-30, 50, 0);
directionalLight.castShadow = true;
directionalLight.shadow.camera.bottom = -15;



// Set the movement keys to false
const keys = {
    a: {pressed: false},
    d: {   pressed: false},
    s: {pressed: false},
    w: {pressed: false},
    Space: {pressed: false}
}


window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = true;
            break;
        case 'KeyD':
            keys.d.pressed = true;
            break;
        case 'KeyW':
            keys.w.pressed = true;
            break;
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'Space':
            cube.velocity.y = 0.05;
            break;
    }
});


window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = false;
            break;
        case 'KeyD':
            keys.d.pressed = false;
            break;
        case 'KeyW':
            keys.w.pressed = false;
            break;
        case 'KeyS':
            keys.s.pressed = false;
            break;
    }
});

const gui = new dat.GUI()
const options = {
    cubeColor: '#0000FF'
};

const colorController = gui.addColor(options, 'cubeColor');
colorController.onChange(function(newValue) {
    cube.material.color.set(newValue);
});



const rain = [];

let frames = 0;
let rate = 200;

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    
    cube.velocity.x = 0;
    cube.velocity.z = 0;

    if(keys.a.pressed){
        cube.velocity.x = -0.05;
    }
    else if(keys.d.pressed){
        cube.velocity.x = 0.05;
    }
    else if(keys.w.pressed){
        cube.velocity.z = -0.05;
    }
    else if(keys.s.pressed){
        cube.velocity.z = 0.05;
    }

    

    cube.update(floor);
    rain.forEach((raindrop, i) => {
        raindrop.update(floor)

        if( boxCollision({box1:cube, box2: raindrop})) 
        {
            cube.material.color.set(new THREE.Color(Math.random(), Math.random(), Math.random()));
            scene.remove(raindrop);
            rain.splice(i, 1);
        }
    });
        
        

    if (frames % rate === 0) {
        if (rate > 20) rate -= 90;
        const raindrop = new BOX({
            width: 0.25, 
            height: 0.25, 
            depth: 0.25, 
            position: {
                x: (Math.random() - 0.5) * 100,
                y: 5, 
                z: (Math.random() - 0.5) * 100
            },
            velocity: {
                x: 0,
                y: -0.001, 
                z: 0
            },
            color: Math.random() * '0xffffff'
        });
        rain.push(raindrop);
        raindrop.castShadow = true;
        scene.add(raindrop);
    }

    frames++;
}

animate();

