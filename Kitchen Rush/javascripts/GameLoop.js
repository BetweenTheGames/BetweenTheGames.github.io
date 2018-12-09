/** 
 * Bucle principal del juego
 * namespace: GameLoop
 * ups - Actualizaciones por segundo
 * fps - Frames por segundo
*/

var GameLoop = {
    idEjecucion: null,
    ultimoRegistro: 0,
    ups: 0,
    fps: 0,
    debug: false,
    primeraEjecucion: true,
    gameOver: false,
    velocidadIngredientes: 2.5,
    incrementar: false,
    tiempoCreacionIngredientes: 60,
    auxTiempoCreacionIngredientes: 60,
    crear: 0,
    audioCorrecto: new Audio("assets/audios/correcto.wav"),
    musicaJuego: new Audio("assets/audios/Game_Theme.m4a"),

    nivelDificultad: new Array(),
    ingredientesEmplatados: new Array(),
    platosCompletados: new Array(),

    iterar: function(registroTemporal) {

        if(!GameLoop.gameOver) {
            GameLoop.idEjecucion = window.requestAnimationFrame(GameLoop.iterar);
        }
        if(GameLoop.crear >= GameLoop.tiempoCreacionIngredientes) {
            GameLoop.crear = 0;
            GameLoop.creacionIngredientes();
        }

        // Final del loop. Actualizacion y pintado
        GameLoop.actualizar(registroTemporal);
        GameLoop.pintar(registroTemporal);

        // Contador de FPS y APS
        if(registroTemporal-GameLoop.ultimoRegistro > 999) {
            GameLoop.ultimoRegistro = registroTemporal;

            // Primera ejecucion
            if(GameLoop.primeraEjecucion) {
                Game.platos = [GameLoop.creacionPlatos(false), GameLoop.creacionPlatos(true)];
                GameLoop.musicaJuego.addEventListener('ended', function() {
                    this.currentTime = 0;
                    this.play();
                }, false);
				//musicaJuego.volume = sessionStorage.getItem('Volumen');
                GameLoop.musicaJuego.play();
                
                GameLoop.primeraEjecucion = false;
            }

            if(Game.contrareloj)
                Game.actualizarCronometro();
            
            console.log("APS: " + GameLoop.ups + " | " + "FPS: " + GameLoop.fps);

            GameLoop.ups = 0;
            GameLoop.fps = 0;
        }
    },

    pausar: function() {

    },

    // Actualizacion de los platos e ingredientes y manejo de controles. [999 = 1s]
    actualizar: function(registroTemporal) {
        GameLoop.ups++;
        GameLoop.crear++;

        // Controlador de teclado
        document.onkeydown = GameLoop.controladorTeclado;

        // Movimiento de los elementos
        Game.ingredientes.forEach(function(elemento) {
            elemento.mover();
            if(elemento.posY > canvas.height) {
                elemento.autodestruccion();
            }
        });

        // Logica de si el ingrediente sirve o no en el plato
        GameLoop.ingredientesEmplatados.forEach(function(elemento) {
            elemento.moverLados();
            GameLoop.anadirIngrediente(elemento);
        });

        // Mover plato al completarse
        GameLoop.platosCompletados.forEach(function(elemento) {
            elemento.moverLado();
            if(elemento.posX < -40 || elemento.posX > canvas.width) {
                elemento.destruirse();
            }
        })

        // Game over por fin de tiempo
        if(Game.contrareloj) {
            if(Game.minutos < 0) {
                GameLoop.gameOver = true;
                let puntuacion = Game.platosCompletados * (GameLoop.nivelDificultad.length+1);
                sessionStorage.setItem("puntosPartida", puntuacion);
                location.href = "finjuego.html";
            }
        }        

        // Game over por fallos en los platos
        if(Game.maraton) {
            if(Game.nivelEnfado.length >= 3) {
                GameLoop.gameOver = true;
                let puntuacion = Game.platosCompletados * (GameLoop.nivelDificultad.length+1);
                sessionStorage.setItem("puntosPartida", puntuacion);
                location.href = "finjuego.html";
            }
        }
    },

    // Pintado del canvas
    pintar: function(registroTemporal) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "black";
        GameLoop.fps++;       

        // Fondo
        context.drawImage(Game.fondo, 0, 0, canvas.width, canvas.height);
        //console.log("fondo ancho: " + canvas.width + " fondo alto: " + canvas.height);

        // DEBUG visual
        if(GameLoop.debug) {
            Game.triggers.forEach(function(elemento) {
                elemento.drawGizmo();
            });
        } 

        // Pintado de los ingredientes
        Game.ingredientes.forEach(function(elemento) {
            elemento.dibujarEnCanvas();
        });        
        GameLoop.ingredientesEmplatados.forEach(function(elemento) {
            elemento.dibujarEnCanvas();
        });

        // Pintado de los platos
        Game.platos.forEach(function (elemento) {
            elemento.dibujarEnCanvas(false);
            //console.log("PosX: " + elemento.posX);
        })
        GameLoop.platosCompletados.forEach(function(elemento) {
            elemento.dibujarEnCanvas(true);
            //console.log("PosX: " + elemento.posX);
        })

        // Pintado del Layout (segun el dispositivo)
        if(screen.width < 500) {
            context.font = "900 17px Arial";
            // Cronometro
            if(Game.contrareloj) {
                //context.font = "bold 12px sans-serif";
                if(Game.segundos >= 10 && Game.minutos >= 0) {
                    context.fillText(Game.minutos + ":" + Game.segundos, (canvas.width/2)-20, 30);
                }
                else {
                    context.fillText(Game.minutos + ":0" + Game.segundos, (canvas.width/2)-20, 90);
                }
            }

            // Nivel de enfado
            if(Game.maraton) {
                let posImgX = (canvas.width/2)-50;
                Game.nivelEnfado.forEach(function(elemento) {
                    context.drawImage(elemento, posImgX, 10, 50, 40);
                    posImgX += 25;
                })
            }

            // Nivel de dificultad
            let posImgX = (canvas.width/2)+80;
            GameLoop.nivelDificultad.forEach(function(elemento) {
                context.drawImage(elemento, posImgX, canvas.height-45, 15, 40);
                posImgX += 20;
            })

            // Platos completados
            context.fillText("Platos: " + Game.platosCompletados, 5, canvas.height-5);
        }
        else if(screen.width < 1100) {
            context.font = "900 25px Arial";
            // Cronometro
            if(Game.contrareloj) {
                //context.font = "bold 12px sans-serif";
                if(Game.segundos >= 10 && Game.minutos >= 0) {
                    context.fillText(Game.minutos + ":" + Game.segundos, (canvas.width/2)-10, 90);
                }
                else {
                    context.fillText(Game.minutos + ":0" + Game.segundos, (canvas.width/2)-10, 90);
                }
            }

            // Nivel de enfado
            if(Game.maraton) {
                let posImgX = (canvas.width/2)-60;
                Game.nivelEnfado.forEach(function(elemento) {
                    context.drawImage(elemento, posImgX, 50, 80, 70);
                    posImgX += 40;
                })
            }

            // Nivel de dificultad
            let posImgX = (canvas.width/2)+140;
            GameLoop.nivelDificultad.forEach(function(elemento) {
                context.drawImage(elemento, posImgX, canvas.height-75, 25, 70);
                posImgX += 30;
            })

            // Platos completados
            context.fillText("Platos servidos: " + Game.platosCompletados, 5, canvas.height-5);
        }
        else {
            context.font = "900 35px Arial";
            // Cronometro
            if(Game.contrareloj) {
                //context.font = "bold 12px sans-serif";
                if(Game.segundos >= 10 && Game.minutos >= 0) {
                    context.fillText(Game.minutos + ":" + Game.segundos, (canvas.width/2)-20, 90);
                }
                else {
                    context.fillText(Game.minutos + ":0" + Game.segundos, (canvas.width/2)-20, 90);
                }
            }

            // Nivel de enfado
            if(Game.maraton) {
                let posImgX = (canvas.width/2)-80;
                Game.nivelEnfado.forEach(function(elemento) {
                    context.drawImage(elemento, posImgX, 40, 100, 90);
                    posImgX += 50;
                })
            }

            // Nivel de dificultad
            let posImgX = (canvas.width/2)+200;
            GameLoop.nivelDificultad.forEach(function(elemento) {
                context.drawImage(elemento, posImgX, canvas.height-80, 25, 70);
                posImgX += 35;
            })

            // Platos completados
            context.fillText("Platos servidos: " + Game.platosCompletados, 5, canvas.height-5);
        }
    },

    // Creacion aleatoria de los ingredientes
    creacionIngredientes: function() {
        let randomIngrediente;
        let ingredienteSeleccionado;

        // Algoritmo de creacion de los platos
        let numeroRandom = Math.random();
        if(numeroRandom < 0.3) { // Crea el ingrediente de la izquierda. 20%
            let nombreIngrediente = Game.platos[0].receta[Game.platos[0].ingredienteActual]
            for(i = 0; i < Game.ingredientesJSON.length; i++) {
                if(Game.ingredientesJSON[i].nombre == nombreIngrediente) {
                    ingredienteSeleccionado = Game.ingredientesJSON[i];
                    break;
                }
            }
        }
        else if(numeroRandom > 0.3 && numeroRandom < 0.6) { // Crear el ingrediente de la derecha. 20%
            let nombreIngrediente = Game.platos[1].receta[Game.platos[1].ingredienteActual]
            for(i = 0; i < Game.ingredientesJSON.length; i++) {
                if(Game.ingredientesJSON[i].nombre == nombreIngrediente) {
                    ingredienteSeleccionado = Game.ingredientesJSON[i];
                    break;
                }
            }
        }
        else { // Crea un ingrediente aleatorio
            randomIngrediente = Math.floor(Math.random() * Game.ingredientesJSON.length);
            ingredienteSeleccionado = Game.ingredientesJSON[randomIngrediente];
        }

        // Aumento de la velocidad de los ingredientes cada 5 platos completados
        if((Game.platosCompletados%5) == 0 && GameLoop.incrementar) {
            GameLoop.tiempoCreacionIngredientes -= 10;
            GameLoop.velocidadIngredientes += 2.5;
            GameLoop.nivelDificultad.push(Game.dificultad);
            GameLoop.incrementar = false;
            Game.ingredientes = [];

            if(Game.contrareloj) {
                Game.aumentarCronometro();
                console.log("Aumentar");
            }
        }
        if(Game.platosCompletados%5 != 0) {
            GameLoop.incrementar = true;
        }

        return new Ingrediente(ingredienteSeleccionado.nombre,
                        ingredienteSeleccionado.ruta,
                        GameLoop.velocidadIngredientes);
    },

    // Creacion aleatoria de los platos
    creacionPlatos: function(derecha) {
        let randomPlato = Math.floor(Math.random() * (Game.platosJSON.length - 0) + 0);
        let platoSeleccionado = Game.platosJSON[randomPlato];
        
        return new Plato(platoSeleccionado.nombre,
                  platoSeleccionado.rutas,
                  platoSeleccionado.receta,
                  platoSeleccionado.lista,
                  derecha);
        //console.log("Plato: " + platoSeleccionado.nombre);
    },

    // Logica de si el ingrediente sirve o no en el plato
    anadirIngrediente: function(elemento) {
        // Plato derecha
        if(elemento.derecha) { 
            if(Game.triggers[2].intersectsPlato(elemento)) {
                elemento.emplatado();
                if(!Game.platos[1].comprobarIngrediente(elemento.nombre)) { // En caso de que el ingrediente seleccionado sea erroneo. Se crea un plato nuevo;
                    Game.platos.pop();
                    GameLoop.creacionPlatos(true);

                    if(Game.maraton)
                        Game.nivelEnfado.push(Game.enfadoImg);
                }
                else { // En caso de que el ingrediente seleccionado sea correcto
                    if(Game.platos[1].ingredienteActual >= Game.platos[1].numIngredientes) { // En caso de que el plato ya este completo. Se crea uno nuevo
                        Game.platosCompletados++;
                        GameLoop.audioCorrecto.play();
                        Game.platos[1].platoCompletado(Game.platos[1]);
                        Game.platos.pop();
                        GameLoop.creacionPlatos(true);
                    }
                }
            }
        }
        // Plato izquierda
        else { 
            if(Game.triggers[1].intersectsPlato(elemento)) {
                elemento.emplatado();
                if(!Game.platos[0].comprobarIngrediente(elemento.nombre)) { // En caso de que el ingrediente seleccionado sea erroneo. Se crea un plato nuevo
                    Game.platos.shift();
                    GameLoop.creacionPlatos(false);

                    if(Game.maraton)
                        Game.nivelEnfado.push(Game.enfadoImg);
                }
                else { // En caso de que el ingrediente seleccionado sea correcto
                    if(Game.platos[0].ingredienteActual >= Game.platos[0].numIngredientes) { // En caso de que el plato ya este completo. Se crea uno nuevo
                        Game.platosCompletados++;
                        GameLoop.audioCorrecto.play();
                        Game.platos[0].platoCompletado(Game.platos[0]);
                        Game.platos.shift();
                        GameLoop.creacionPlatos(false);
                    }
                }
            }
        }
    },

    // Controlador del teclado
    controladorTeclado: function(e) {
        // Derecha: D || ->
        if(e.keyCode == 68 || e.keyCode == 39) {
            GameLoop.pulsarDerecha();
        }

        // Izquierda: A || <-
        if(e.keyCode == 65 || e.keyCode == 37) {
            GameLoop.pulsarIzquierda();
        }

        // Cambio modo debug/modo normal: f7
        if(e.keyCode == 118) {
            if(GameLoop.debug) {
                GameLoop.debug = false;
            }
            else {
                GameLoop.debug = true;
            }
        }
    },

    pulsarDerecha: function() {
        for(let elemento of Game.ingredientes) {
            if(Game.triggers[0].intersectsArea(elemento)) {
                elemento.llevarAPlato(true);
                break;
            }
        }
    },

    pulsarIzquierda: function() {
        for(let elemento of Game.ingredientes) {
            if(Game.triggers[0].intersectsArea(elemento)) {
                elemento.llevarAPlato(false);
                break;
            }
        }
    }
};