;
((d, w, n, c) => {
    //#region ONLINE
    window.addEventListener('online', () => setOnlineStatus(true));
    window.addEventListener('offline', () => setOnlineStatus(false));
    
    var setOnlineStatus = isOnline => { 
        if (isOnline) {
            $("#no-wifi").hide();
        }
        else {
            $("#no-wifi").show();
            messageError("FUERA DE LÍNEA");
        }
    };
    
    setOnlineStatus(n.onLine);
    //#endregion
    
    //#region Registro SW
    
    if ( 'serviceWorker' in n ) {
        w.addEventListener('load', () => {
            $("#paso").text("0");
          n.serviceWorker.register('./service-worker.js')
            //.then( registration => n.serviceWorker.ready)
            //.then(registration => { // register sync
              //return registration.sync.register('getAllVagons');
            //})
            //.then(() => {
                //$("#paso").text("0.1");
                //fetchData();
            //})
            .catch( error => {
                $("#paso").text(error.message);
                messageError(error.message) 
                
            });
            
            $("#paso").text("0.1");
            fetchData();
        })
    }
    
    //#endregion
    
    //#region GET DATA
    function fetchData() {
        var responseData;
        $("#loading-icon").show();
        $("#paso").text("1");
        fetch(new Request("https://ternium-pwa-srjavi.c9users.io/api/Vagon/read.php", {cache: "no-store"}))
            .then(response => {
                $("#paso").text("2");
                if (response.status == 200) {
                  return response.text();
                } else {
                  //si esta caido le servicio
                  return { error: true, message: "Servicio caído."};
                }
            })
            .then(responseText => {
                $("#paso").text("3");
                responseData = JSON.parse(responseText);
            })
            .catch( error => {
                $("#paso").text("4");
                console.log(error);
                responseData = JSON.parse(JSON.stringify({ error: true, message: "Servicio caído."}));
                messageError(responseData.message);
                
            })
            .then(responseData => {
                $("#paso").text("5");
                responseData = responseData;
                return openDB();
            })
            .then(db => {
                $("#paso").text("6");
                if (responseData.error) {
                    return db;
                } else {
                    return saveDB(db, responseData);
                }
                
            })
            .then(db => {
                $("#paso").text("7");
                return readDB(db);
            })
            .then(dataReader => {
                $("#paso").text("7.1");
                
                document.getElementById('list-vagones').innerHTML = "";
                Promise.all(
                    dataReader.map(vagon => {
                            document.getElementById('list-vagones').innerHTML += addVagonToList(vagon.vagon);
                        })
                    )
                    .then(() => {
                        clickVagon();
                    })
                    .catch(() => {
                      messageError("error listando");
                      //throw Error('Events listando');
                    });
                
            })
            .catch( error => {
                $("#paso").text("8");
                console.log(error);
                messageError(error.message);
            })
            .then(() => {
                //$("#paso").text("9");
                $("#loading-icon").hide();
            });
    }
    
    function openDB() {
        return new Promise((resolve, reject) => {
            
            var open_request = window.indexedDB.open("ternium", 4);
            open_request.onerror = function(event) {
                reject(new Error("Error opening database."));
            };
            open_request.onsuccess = function(event) {
                resolve(event.target.result);
            };
            open_request.onupgradeneeded = function(event) {
                var db = event.target.result;
                var objectStore = db.createObjectStore("Vagones", { keyPath: "vagon" });
                objectStore.createIndex("planchones", "planchones");
                
                db.onerror = function(errorEvent) {
                    reject(new Error("Error loading database."));
                };
                
            };
        })
    }
    
    function saveDB(db, data) {
        return new Promise((resolve, reject) => {
            if (data.hasOwnProperty('Vagones') && data.Vagones.length > 0) {
                var tx = db.transaction(["Vagones"], "readwrite");
                var store = tx.objectStore("Vagones");
                store.clear();
                
                Promise.all(data.Vagones.map(vagon => store.put({ vagon: vagon.nombre, planchones: vagon.planchones})))
                    .then(() => resolve(db))
                    .catch(() => {
                      tx.abort();
                      messageError("error put");
                      reject(new Error('Objects were not added to the store'));
                    });
                
            }
        });
    }
    
    function readDB(db) {
        return new Promise((resolve, reject) => {
            var store = db.transaction("Vagones", "readonly").objectStore("Vagones");
            var request = store.getAll();
            request.onsuccess = function() {
                resolve(request.result);
            }
            request.onerror = function(event) {
                // The uniqueness constraint of the "by_title" index failed.
                //report(request.error);
                messageError("error read " + request.error);
                reject(new Error(request.error));
                // Could call event.preventDefault() to prevent the transaction from aborting.
            };
        });
    }
    
    function addVagonToList(vagon) {
        return '<a href="#" class="list-group-item" data-vagon="'+ vagon + '">' + vagon + '<span class="chevron"><i class="fa fa-chevron-right" aria-hidden="true"></i></span><span class="spin hidden"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span></a>';
    }
    
    function clickVagon(argument) {
        $(document.body).off("click", $('#list-vagones .list-group-item'));
        $('#list-vagones .list-group-item').click(function () {
            var element = this;
            setTimeout(function() { 
                var vagon = $(element).data("vagon");
                $("#vagonTitle").html(vagon);
                $(".page2").toggle("slide",{direction: "right"},200);
                
                openDB()
                    .then(db => getVagon(db, vagon))
                    .catch( error => {
                        console.log(error);
                        messageError(error.message);
                    })
                
            }, 200);
        });
    }
    
    function getVagon(db, vagon) {
        return new Promise((resolve, reject) => {
            var store = db.transaction(["Vagones"], "readwrite").objectStore("Vagones");
            var get_request = store.get(vagon);
            
            get_request.onerror = function(event) {
                messageError("Error recuperando los datos.");
                reject(new Error("Error getting value from database."));
            }
            
            get_request.onsuccess = function(event) {
                var data = get_request.result;
                var html = '';
                if (data.hasOwnProperty('planchones') && data.planchones.length > 0) {
                    for (var i = 0; i < data.planchones.length; i++) {
                        html += addPlanchonToList(data.planchones[i].nombre);
                    }
                }
                document.getElementById('list-planchones').innerHTML = html;
                //deletePlanchon();
                resolve();
            };
        });
    }
    
    function savePlanchon(db, vagon, planchon) {
        return new Promise((resolve, reject) => {
            var store = db.transaction(["Vagones"], "readwrite").objectStore("Vagones");
            var get_request = store.get(vagon);
            
            get_request.onerror = function(event) {
                messageError("Error recuperando los datos.");
                reject(new Error("Error getting value from database."));
            }
            
            get_request.onsuccess = function(event) {
                var data = get_request.result;
                data.planchones.push(planchon);
                var put_request = store.put(data);

                put_request.onerror = function(event) {
                    reject(new Error("Error saving value to database."));
                }
                
                put_request.onsuccess = function(event) {
                    resolve(planchon);
                };
            };
        });
    }
    
    function addPlanchonToList(planchon) {
        return '<a href="#" class="list-group-item" style="height: 56px;padding-top: 18px" data-planchon="'+ planchon + '">' + planchon + '<button class="btn btn-danger btn-delete" style="float: right;margin-top: -7px;"><i class="fa fa-trash" aria-hidden="true"></i></button></a>';
    }
    
    //#endregion
    
    //#region Nofiticacion
    
    // Comprobamos si el navegador soporta las notificaciones
    if (!("Notification" in window)) {
        //messageError("Este navegador no es compatible con las notificaciones");
    }

    // Comprobamos si los permisos han sido concedidos anteriormente
    else if (Notification.permission === "granted") {
        // Si es correcto, lanzamos una notificación
        //var notification = new Notification("Hola!");
    }

    // Si no, pedimos permiso para la notificación
    else if (Notification.permission !== 'denied' || Notification.permission === "default") {
        Notification.requestPermission(function (permission) {
            // Si el usuario nos lo concede, creamos la notificación
            if (permission === "granted") {
                var notification = new Notification("Hola!");
            }
        });
    }
    //#endregion
    
    //#region Funciones
    
    $('#volver').click(function () {
        $(".page2").toggle("slide",{direction: "right"},200);
    });
    
    $("#addPlanchon").click(function(e) {
        if ($("#planchon").val() == "") {
            return;
        }
        openDB()
            .then(db => savePlanchon(db, $("#vagonTitle").text(), {nombre: $("#planchon").val()}))
            .then(planchon => {
                var item = '<a href="#" class="list-group-item" style="height: 56px;padding-top: 18px" data-nuevo="1" data-planchon="'+ planchon.nombre + '">' + planchon.nombre + '<button class="btn btn-danger btn-delete" style="float: right;margin-top: -7px;"><i class="fa fa-trash" aria-hidden="true"></i></button><i class="fa fa-cloud-upload" aria-hidden="true"></i></a>';
        
                document.getElementById('list-planchones').innerHTML += item;
                $("#planchon").val("");
                $("#planchon").focus();
            })
            .then(function() {
              return n.serviceWorker.ready;
            }).then(function(reg) {
              return reg.sync.register('syncTest');
            }).then(function() {
              //messageError('Sync registered');
            })
            .catch((error) => {
                messageError(error.message);
            });
        
    });
    
    n.serviceWorker.addEventListener('message', e => {
        console.log('Desde la Sincronización de Fondo: ', e.data);
        
        if (e.data == 'syncTest') {
            if (Notification.permission === "granted"){
                var notification = new Notification("syncTest!");
            }
        }
    })
    
    $("#GuardarDatos").click(function(e) {
        
        var vagon = $("#vagonTitle").text();
        $("#spinGuardar").show();
        Promise.all(
                $( "#list-planchones a[data-nuevo='1']" ).map(planchon => {
                    var data = {
                        nombre: $(planchon).data("planchon"),
                        vagon_nombre: vagon
                    };
                    
                    fetch('https://ternium-pwa-srjavi.c9users.io/api/Planchon/create.php', {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' }
                    })
                    .then((response) => {
                        c(response);
                    })
                    .catch( error => {
                        console.log(error);
                        //messageError(error.message);
                        throw Error('Error guardando datos')
                    })
                })
            )
            .then(() => {
                
            })
            .catch((error) => {
                c(error.message);
                messageError(error.message);
            })
            .then(() => $("#spinGuardar").hide());
        
    });
    //#endregion
})(document, window, navigator, console.log);

function messageError(message) {
    swal({
        title: 'Error!',
        text: message,
        type: 'error',
        confirmButtonText: 'Continue'
    })
}