;
((d, w, n, c) => {
    
    // constants
    var objectStoreName = "vagones";
    var request = window.indexedDB.open("ternium", 4);
    var getVagonesUrl = "https://ternium-pwa-srjavi.c9users.io/api/Vagon/read.php";
    
    
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
    
    // if the local db is older or not yet initialised
    request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // create an object store called "names" with the autoIncrement flag set as true.    
        var objStore = db.createObjectStore(objectStoreName, { keyPath: "vagon" });
        
        objStore.createIndex("planchones", "planchones");
        
        db.onerror = function(errorEvent) {
            messageError("Error loading database.");
        };
    };
    
    // view models
    function PlanchonModel() {
        var self = this;
        self.nombre = "";
        self.local = false;
    }
    
    function VagonModel() {
        var self = this;
        self.nombre = "";
        self.planchones = [];
    }
    
    function VagonesAdapter() {
        var self = this;

        // map the server response to the client side view model
        self.toVagon = function(data) {
            var vagonModel = new VagonModel();
            vagonModel.nombre = data.vagon;
            vagonModel.planchones = data.planchones;
            return vagonModel;
        };

        // map the server response to the client side view model
        self.toVagones = function(data) {
            if (data && data.length > 0) {
                return data.map(function(item) {
                    return self.toVagon(item);
                });
            }
            return [];
        };
    }
    
    // services
    function VagonesService() {
        var self = this;

        self.getVagon = function (responseData, objectStore) {
            return new Promise((resolve, reject) => {
                messageSuccess("123bien1112333XXWW");
                var response = objectStore.openCursor();
                response.onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        c(cursor);
                        //messageError(cursor.value.vagon + " 333333")
                        // continue on to the next item in the cursor
                        cursor.continue();
                    } else {
                        messageSuccess("123bien1112333XXBB");
                        c(responseData);
                        resolve(responseData);
                    }
                }
                
                response.onerror = function(event) {
                    messageSuccess("123bien1112333XX1DD");
                    reject(new Error(response.error +"KK"));
                };
                
                // request all data from the store
                // var response = objectStore.get(vagon.vagon);
                
                // response.onerror = function(event) {
                //     reject(new Error(response.error));
                // };
    
                // response.onsuccess = function(event) {
                //     var data = response.result;
                //     if (data == undefined) {
                //         messageError("333333")
                //     }
                //     self.updateVagon(vagon, objectStore, data)
                //     .then(() => resolve())
                //     .catch((error) => reject(error));
                // };
            });
        }
        
        self.updateVagon = function (data, objectStore) {
            return new Promise((resolve, reject) => {
                
                return Promise.all(data.map(vagon => {
                        objectStore.add(vagon);
                    }))
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(new Error(error.message));
                    });
                
                //var local = differenceInFirstArray(data.planchones, vagon.planchones, "nombre");
                
                //vagon.planchones = vagon.planchones.concat(local);
                // request all data from the store
                //var response = objectStore.put({ vagon: vagon.vagon, planchones: vagon.planchones});
                
                // response.onerror = function(event) {
                //     reject(new Error(response.error));
                // };
    
                // response.onsuccess = function(event) {
                //     var data = response.result;
                //     resolve(data);
                // };
            });
        }



        self.get = function() {
            
            return new Promise((resolve, reject) => {
                var responseData;
                fetch(new Request(getVagonesUrl, {cache: "no-store"}))
                .then(response => {
                    if (response.status == 200) {
                      return response.text();
                    }
                })
                .then(responseText => {
                    return JSON.parse(responseText).Vagones;
                    
                    // create a transaction for the indexedDB
                    // var transaction = request.result.transaction([objectStoreName], "readwrite");

                    // // retrieve the object store
                    // var objectStore = transaction.objectStore(objectStoreName);
                    
                    // c(responseData.Vagones);
                    // c(responseData.Vagones.filter(vagon => !currentCaches.includes(cacheName)));
                    // return Promise.all(responseData.Vagones.map(vagon => objectStore.put({ vagon: vagon.nombre, planchones: vagon.planchones})))
                    // //.then(() => resolve(responseData))
                    // .catch(() => {
                    //   transaction.abort();
                    //   reject(new Error('Objects were not added to the store'));
                    // });
                })
                .catch( error => {
                    c(error.message);
                    //reject(new Error("Servidor caído."));
                    messageError("Servidor caído.");
                })
                .then((responseData) => {
                    
                    c(responseData);
                    // create a transaction for the indexedDB
                    var transaction = request.result.transaction([objectStoreName], "readwrite");
        
                    // transaction.oncomplete = function() {
                    //     messageSuccess("123bien1112333XXZ89");
                    //   };
                
                    //   transaction.onerror = function() {
                    //     messageSuccess("123bien1112333XXZ99");
                    //   };
                    // retrieve the object store
                     var objectStore = transaction.objectStore(objectStoreName);
                    messageSuccess("123bien1112333XXZZ");
                    return self.getVagon(responseData, objectStore)
                    .then(data => {
                        messageSuccess("123bien1112333XX1");
                        return self.updateVagon(data, objectStore);
                    })
                    .then(() => { 
                        messageSuccess("123bien1112333XX12");
                        resolve(responseData);
                    })
                    .catch((error) => messageError(error.message));
                    // return Promise.all(responseData.map(vagon => {
                    //     return self.getVagon(vagon, objectStore)
                    //     .catch((error) => c(error.message));
                    // }))
                    // .then(() => {
                    //     //messageSuccess("OK!")
                    //     resolve(responseData);
                    // })
                    // .catch(error => c(error.message));
                    
                    // // request all data from the store
                    // var response = objectStore.getAll();
                    // resolve(responseData);
                    // response.onerror = function(event) {
                    //     reject(new Error(response.error));
                    // };
        
                    // response.onsuccess = function(event) {
                    //     //if (response.result && response.result.length) {
                    //     c(response.result);
                    //         resolve(response.result);
                    //     //}
                    //     //resolve();
                    // };
                })
                .catch((error) => messageError(error.message + " mallll"));;
            });
        };
        
        self.getPlanchones = function (vagon) {
            return new Promise((resolve, reject) => {
                messageSuccess("get1");
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
    messageSuccess("get2");
                // retrieve the object store
                var objectStore = transaction.objectStore(objectStoreName);
                messageSuccess("get3");
                // request all data from the store
                var response = objectStore.get(vagon);
                messageSuccess("get4");
                response.onerror = function(event) {
                    reject(new Error(response.error));
                };
    
                response.onsuccess = function(event) {
                    $("#list-planchones").html("");
                    $("#loading-icon").show();
                    messageSuccess("asdasddd22 " + response.result);
                    // self.listPlanchon(response.result)
                    // .then(() => resolve())
                    // .catch((error) => reject(new Error("K"+error.message)));
                    // return Promise.all(response.result.planchones.map(planchon => {
                    //         $("#list-planchones").append(addPlanchonToList(planchon.nombre, planchon.local));
                    //     }))
                    //     .then(() => {
                    //         $("#loading-icon").hide();
                    //         resolve();
                    //     })
                    //     .catch((error) => {
                    //         $("#loading-icon").hide();
                    //         messageError("aaaaaaaaaa")
                    //         reject(new Error(error.message));
                    //     });
                };
            });
        };
        
        self.listPlanchon = function (data) {
            return new Promise((resolve, reject) => {
                if (data) {
                    return Promise.all(data.planchones.map(planchon => {
                        $("#list-planchones").append(addPlanchonToList(planchon.nombre, planchon.local));
                    }))
                    .then(() => {
                        $("#loading-icon").hide();
                        resolve();
                    })
                    .catch((error) => {
                        $("#loading-icon").hide();
                        messageError("aaaaaaaaaa")
                        reject(new Error(error.message));
                    });
                } else {
                    resolve();
                }
            });
        }
        
        self.addPlanchon = function (vagon, planchon) {
            return new Promise((resolve, reject) => {
                // create a transaction for the indexedDB
                var transaction = request.result.transaction([objectStoreName], "readwrite");
    
                // retrieve the object store
                var objectStore = transaction.objectStore(objectStoreName);
                
                // request all data from the store
                var response = objectStore.get(vagon);
                
                response.onerror = function(event) {
                    reject(new Error(response.error));
                };
    
                response.onsuccess = function(event) {
                    var data = response.result;
                    data.planchones.push({ nombre: planchon, local: true});
                    var put_request = objectStore.put(data);
                    
                    put_request.onerror = function(event) {
                        reject(new Error("Error saving value to database."));
                    }
                    
                    put_request.onsuccess = function(event) {
                        resolve(planchon);
                    };
                };
            });
        };
    }
    
    function VagonesController(vagonesService, vagonesAdapter) {
        var self = this;

        // return all messages from the DB
        self.get = function() {
            
            return new Promise((resolve, reject) => {
                vagonesService.get().then(function(response) {
                    messageSuccess("123");
                   resolve(vagonesAdapter.toVagones(response)); 
                })
                .catch( error => {
                    messageSuccess("1233331111");
                    reject(error);
                });
            });
            
        };
    }
    
    (function($) {
        
        // initialize the services and adapters
        var vagonesService = new VagonesService();
        var vagonesAdapter = new VagonesAdapter();

        // initialize the controller
        var vagonesController = new VagonesController(vagonesService, vagonesAdapter);
        
        $(function() {
            var $addPlanchon = $("#addPlanchon");
            var $planchon = $("#planchon");
            var $guardarDatos = $("#guardarDatos");
            var $volver = $("#volver");
            
            
            $addPlanchon.on("click", function(event) {
                event.preventDefault();
                if ($planchon.val().length > 0) {
                    vagonesService.addPlanchon($("#vagonTitle").html(), $planchon.val().toUpperCase())
                    .then((planchon) => {
                        $("#list-planchones").append(addPlanchonToList(planchon, true));  
                    });
                    
                    $planchon.val("");
                    $planchon.focus();
                }
            });
            
            // user presses enter
            $planchon.on("keydown", function(event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $addPlanchon.click();
                }
            });
            
            $guardarDatos.on("click", function(event) {
                event.preventDefault();
                    return new Promise((resolve, reject) => {
                        Promise.all($("#list-planchones a[data-local='true']").map((index, planchon) => {
                            
                            var data = {
                                nombre: $(planchon).data("planchon"),
                                vagon_nombre: $("#vagonTitle").html()
                            };
                            
                            return fetch('https://ternium-pwa-srjavi.c9users.io/api/Planchon/create.php', {
                                method: 'POST',
                                body: JSON.stringify(data),
                                headers: { 'Accept': 'application/json',
                                    'Content-Type': 'application/json' }
                            })
                            .then(response => {
                                if (response.status == 200) {
                                  return response.text();
                                }
                            })
                            .then(responseText => {
                                //c(responseText);
                                //c(JSON.parse(responseText));
                            })
                            .catch( error => {
                                c(error.message);
                                //reject(new Error('Servidor caído.'));
                            });
        
                        }))
                        .then(() => {
                            //request = window.indexedDB.open("ternium", 2);
                            $(".page2").toggle("slide",{direction: "right"},200);
                            resolve();
                        })
                        .catch((error) => {
                          //reject(new Error('Objects were not added to the store'));
                          messageError(error.message);
                        });
                    });
            });
            
            $volver.on("click", function(event) {
                event.preventDefault();
                $(".page2").toggle("slide",{direction: "right"},200);
            });
        });
        
        request.onsuccess = function() {
            
            // retrieve all the messages from the DB
            vagonesController.get()
                .then(function(response) {
                    messageSuccess("Bien12");
                    $("#list-vagones").html("");
                    return Promise.all(response.map(vagon => {
                        
                        $("#list-vagones").append('<a href="#" class="list-group-item" data-vagon="'+ vagon.nombre + '">' + vagon.nombre + '<span class="chevron"><i class="fa fa-chevron-right" aria-hidden="true"></i></span><span class="spin hidden"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span></a>');
    
                    }))
                    .then(() => {
                        
                        $("body").off("click", $('#list-vagones .list-group-item'));
                        $('#list-vagones .list-group-item').on("click", function () {
                            var vagon = $(this).data("vagon");
                            $("#vagonTitle").html(vagon);
                            $(".page2").toggle("slide",{direction: "right"},200);
                            vagonesService.getPlanchones(vagon)
                            //.catch((error) => messageError("error 774! " + error.message));
                        });
                        
                    })
                    .catch(() => {
                      throw new Error('Objects were not added to the list.');
                    });
                })
                .catch( error => {
                    messageError(error.message);
                })
                .then(() => $("#loading-icon").hide());
        };
        
        request.onerror = function(event) {
            messageError(request.error +"QQ");
        };
        
    })(jQuery);
    
    function addPlanchonToList(nombre, local) {
        return '<a href="#" class="list-group-item" style="height: 56px;padding-top: 18px" data-planchon="'+ nombre + '" data-local="' + local + '">' + nombre + '</a>';
        //<button class="btn btn-danger btn-delete" style="float: right;margin-top: -7px;"><i class="fa fa-trash" aria-hidden="true"></i></button>
    }
    
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

function differenceInFirstArray(array1, array2, compareField) {
  return array1.filter(function (current) {
    return array2.filter(function (current_b) {
        return current_b[compareField] === current[compareField] && current["local"] === false;
      }).length == 0;
  });
}