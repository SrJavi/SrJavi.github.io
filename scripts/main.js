;
((d, w, n, c) => {
    
    // constants
    var objectStoreName = "vagones";
    var request = window.indexedDB.open("terniumdb");
    //var request = window.indexedDB.deleteDatabase("terniumdb");
    var getVagonesUrl = "https://ternium-pwa-srjavi.c9users.io/api/Vagon/read.php";
    var createPlanchonUrl = 'https://ternium-pwa-srjavi.c9users.io/api/Planchon/create.php';
    
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
    
    
    if ( 'serviceWorker' in n ) {
        w.addEventListener('load', () => {
          n.serviceWorker.register('./service-worker.js')
            .catch( error => messageError(error.message));
        })
    }
    
    // if the local db is older or not yet initialised
    request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // create an object store called "names" with the autoIncrement flag set as true.    
        var objectStore = db.createObjectStore(objectStoreName, { keyPath: "vagon" });
        
        objectStore.createIndex("planchones", "planchones");
        
        db.onerror = function(errorEvent) {
            messageError("Error loading database.");
        };
    };
    
    function VagonesService() {
        var self = this;
        
        self.getData = function () {
            return new Promise((resolve, reject) => {
                
               var responseData;
               
                fetch(new Request(getVagonesUrl, {cache: "no-store"}))
                    .then(response => {
                        if (response.status == 200)  return response.text();
                    })
                    .then(responseText => {
                        resolve(JSON.parse(responseText).Vagones);
                    })
                    .catch( error => {
                        reject(new Error("Servidor caído."));
                    }) 
            });
        }
        
        self.getAllDataDB = function () {
            return new Promise((resolve, reject) => {
                var matching;
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
                
                transaction.oncomplete = function() {
                    c(matching)
                    resolve(matching);
                };
                
                transaction.onerror = function() {
                    reject(new Error(" tx - " + transaction.error));
                };
                
                var objectStore = transaction.objectStore(objectStoreName);
                
                var response = objectStore.getAll();
                
                response.onerror = function(event) {
                    reject(new Error(" updateData - " + response.error));
                };
    
                response.onsuccess = function(event) {
                    
                    matching = response.result;
                    
                    if (matching !== undefined) {
                        // A match was found.
                    } else {
                        // No match was found.
                        reject(new Error("No hay datos"));
                    }
                    
                };
                
            })
        }
        
        self.updateData = function (data) {
            return new Promise((resolve, reject) => {
                
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
                
                transaction.oncomplete = function() {
                    //c("transaction.oncomplete");
                    resolve(data);
                };
                
                transaction.onerror = function() {
                    reject(new Error(" tx - " + transaction.error));
                };
                
                var objectStore = transaction.objectStore(objectStoreName);
                
                //var response = objectStore.getAll();
                
                var response = objectStore.get(data.vagon);
                
                response.onerror = function(event) {
                    reject(new Error(" updateData - " + response.error));
                };
    
                response.onsuccess = function(event) {
                    var matching = response.result;
                    if (matching !== undefined) {
                        // A match was found.
                        var local = getLocalData(matching.planchones, data.planchones, "nombre");
                        //local = [{nombre: "Local Prueba", local: true }]
                        data.planchones = data.planchones.concat(local);
                    } else {
                        // No match was found.
                    }
                    try {
                        var responsePut = objectStore.put(data);
                        
                        responsePut.onerror = function(event) {
                            reject(new Error(" PUT - " + responsePut.error));
                        };
                        
                        responsePut.onsuccess = function(event) {
                            //c("OK PUT", data);
                        };
                    } catch(err) {
                        reject(new Error(" error put2 - " + err));
                    }
                };
                
            })
        }
        
        self.getVagon = function (vagon) {
            return new Promise((resolve, reject) => {
                var data;
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
                
                transaction.oncomplete = function() {
                    //c("transaction.oncomplete");
                    resolve(data);
                };
                
                transaction.onerror = function() {
                    reject(new Error(" tx - " + transaction.error));
                };
                
                var objectStore = transaction.objectStore(objectStoreName);
                
                //var response = objectStore.getAll();
                
                var response = objectStore.get(vagon);
                
                response.onerror = function(event) {
                    reject(new Error(" getVagon - " + response.error));
                };
    
                response.onsuccess = function(event) {
                    var matching = response.result;
                    if (matching !== undefined) {
                        // A match was found.
                        data = matching;
                    } else {
                        // No match was found.
                        reject(new Error(" No se encontro vagón"));
                    }
                };
                
            })
        }
        
        self.addPlanchon = function (data) {
            return new Promise((resolve, reject) => {
                var matching;
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
                
                transaction.oncomplete = function() {
                    //c("transaction.oncomplete");
                    resolve(data.planchon);
                };
                
                transaction.onerror = function() {
                    reject(new Error(" tx - " + transaction.error));
                };
                
                var objectStore = transaction.objectStore(objectStoreName);
                
                //var response = objectStore.getAll();
                
                var response = objectStore.get(data.vagon);
                
                response.onerror = function(event) {
                    reject(new Error(" updateData - " + response.error));
                };
    
                response.onsuccess = function(event) {
                    
                    matching = response.result;
                    
                    if (matching !== undefined) {
                        // A match was found.
                        var local = [{nombre: data.planchon, local: true }];
                        matching.planchones = matching.planchones.concat(local);
                        
                        try {
                            var responsePut = objectStore.put(matching);
                            
                            responsePut.onerror = function(event) {
                                reject(new Error(" PUT - " + responsePut.error));
                            };
                            
                            responsePut.onsuccess = function(event) {
                                //c("OK PUT", data);
                            };
                        } catch(err) {
                            reject(new Error(" error put2 - " + err));
                        }
                    } else {
                        // No match was found.
                        reject(new Error(" No se encontro vagón"));
                    }
                    
                };
                
            })
        }
        
        self.savePlanchon = function (planchon) {
            return new Promise((resolve, reject) => {
                var data = {
                    nombre: $(planchon).data("planchon"),
                    vagon_nombre: $("#vagonTitle").html()
                };
                
                fetch(new Request(createPlanchonUrl, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Accept': 'application/json',
                        'Content-Type': 'application/json' }
                }))
                .then(response => {
                    if (response.status == 200)  
                        resolve();
                    else 
                        reject(new Error("Error al guardar " + data.nombre));
                })
                .catch( error => {
                    reject(new Error("Servidor caído."));
                });
            });
        }
        
    }
    
    function VagonesController(vagonesService) {
        var self = this;

        // return all data from the DB
        self.get = function() {
            return new Promise((resolve, reject) => {
                var local = false;
                vagonesService.getData()
                    .catch(error => {
                        local = true;
                        return vagonesService.getAllDataDB();
                    })
                    .then((responseData) => {
                        local = false;
                        return Promise.all(responseData.map(vagon => vagonesService.updateData(vagon)))
                        .catch((error) => {
                            throw Error('error Promise.all ' + error.message);
                        });
                    })
                    .then((data) => {
                        $("#list-vagones").html("");
                        return Promise.all(data.map(vagon => {
                            $("#list-vagones").append('<a href="#" class="list-group-item" data-vagon="'+ vagon.vagon + '">' + vagon.vagon + '<span class="chevron"><i class="fa fa-chevron-right" aria-hidden="true"></i></span><span class="spin hidden"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span></a>');
                        }));
                    })
                    .then(() => {
                        $("body").off("click", $('#list-vagones .list-group-item'));
                        $('#list-vagones .list-group-item').on("click", function () {
                            var vagon = $(this).data("vagon");
                            
                            vagonesService.getVagon(vagon)
                                .then((dataVagon) => {
                                    $("#list-planchones").html("");
                                    return Promise.all(dataVagon.planchones.map(planchon => {
                                        $("#list-planchones").append(addPlanchonToList(planchon.nombre, planchon.local));
                                    }));
                                })
                                .then(() => {
                                    $("#vagonTitle").html(vagon);
                                    $(".page2").toggle("slide",{direction: "right"}, 200);
                                })
                                .catch((error) => messageError("getVagon " + error.message));
                        });
                    })
                    .then(() => {
                        $("#cargando").hide();
                        $("#recargar").show();
                        resolve(local);
                    })
                    .catch(error => reject(error));
            });
        };
        
        self.add = function() {
            return new Promise((resolve, reject) => {
                if ($("#list-planchones a[data-local='true']").length > 0) {
                    Promise.all($("#list-planchones a[data-local='true']").map((index, planchon) => vagonesService.savePlanchon(planchon)))
                        .then(() => resolve())
                        .catch(error => reject(error));
                    
                } else {
                    reject(new Error("No hay planchones para agregar"))
                }
            });
        }
    }
    
    (function($) {
        
        // initialize the services and adapters
        var vagonesService = new VagonesService();
        // initialize the controller
        var vagonesController = new VagonesController(vagonesService);
        
        $(function() {
            var $volver = $("#volver");
            var $addPlanchon = $("#addPlanchon");
            var $planchon = $("#planchon");
            var $guardarDatos = $("#guardarDatos");
            var $vagonTitle = $("#vagonTitle");
            var $recargar = $("#recargar");
            
            $guardarDatos.on("click", function(event) {
                event.preventDefault();
                
                vagonesController.add()
                    .then(() => {
                        $(".page2").toggle("slide",{direction: "right"},200);
                        $("#recargar").hide();
                        $("#cargando").show();
                        return vagonesController.get();
                    })
                    .then(() => messageSuccess("los planchones han sido enviados"))
                    .catch(error => messageError(error.message));
            });
            
            $addPlanchon.on("click", function(event) {
                event.preventDefault();
                if ($planchon.val().length > 0) {
                    
                    var data = {
                        vagon: $vagonTitle.text(),
                        planchon: $planchon.val()
                    };
                    vagonesService.addPlanchon(data)
                        .then((planchon) => {
                            $("#list-planchones").append(addPlanchonToList(planchon, true));
                            $planchon.val("");
                            $planchon.focus();
                        })
                        .catch(error => messageError(error.message));
                }
            });
            
            $volver.on("click", function(event) {
                event.preventDefault();
                $(".page2").toggle("slide",{direction: "right"},200);
            });
            
            $recargar.on("click", function(event) {
                event.preventDefault();
                $("#recargar").hide();
                $("#cargando").show();
                vagonesController.get()
                    .then((local) => {
                        if (!local) {
                            messageSuccess("Datos recargados");
                        } else {
                            messageError("Servidor Caido. \n Datos locales cargados")
                        }
                    })
                    .catch(error => messageError(error.message));
            });
            
            request.onsuccess = function() {
                vagonesController.get()
                    .then((local) => {
                        if (!local) {
                            messageSuccess("Datos cargados");
                        } else {
                            messageError("Servidor Caido. \n Datos locales cargados")
                        }
                    })
                    .catch(error => messageError(error.message));
            };
        
            request.onerror = function(event) {
                messageError("error 1" + request.error);
            };
            
            
        })
    })(jQuery)
    
})(document, window, navigator, console.log);

function messageError(message) {
    swal({
        title: 'Error!',
        text: message,
        type: 'error',
        confirmButtonText: 'Continue'
    })
}

function messageSuccess(message) {
    swal({
        title: 'Success!',
        text: message,
        type: 'success',
        confirmButtonText: 'Continue'
    })
}

function getLocalData(array1, array2, compareField) {
  return array1.filter(function (current) {
    return array2.filter(function (current_b) {
        return current_b[compareField] === current[compareField];
      }).length == 0;
  });
}

function addPlanchonToList(nombre, local) {
    return '<a href="#" class="list-group-item ' + (local ? "list-group-item-warning" : "list-group-item-success") + '" style="height: 56px;padding-top: 18px" data-planchon="'+ nombre + '" data-local="' + local + '">' + nombre + '</a>';
}