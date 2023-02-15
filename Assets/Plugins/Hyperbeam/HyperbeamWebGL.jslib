mergeInto(LibraryManager.library, {
    getDemoLink: async function(sourceObject) {
        const caller = UTF8ToString(sourceObject);
        if(window.embedUrl === undefined || window.embedUrl === "") {
            const room = location.pathname.substring(1);
            const req = await fetch("https://demo-api.tutturu.workers.dev/" + room);
            if(req.status >= 400) {
                alert("We are out of demo servers! Visit hyperbeam.dev to get your own API key");
                return;
            }

            const body = await req.json();
            if (body.room !== room && location.hostname != 'localhost') {
                history.replaceState(null, null, "/" + body.room, + location.search);
            }

            window.embedUrl = body.url;
        }

        console.log("Demo link received, sending to " + caller);
        unityInstance.SendMessage(caller, "OnDemoLink", window.embedUrl);
    },

    // this will give a native texture ID that we can 
    // pass back to C# for actual rendering
    registerNativeTexture: function(glTexture) {
        var id = GL.getNewId(GL.textures);
        glTexture.name = id;
        GL.textures[id] = glTexture;

        return id;
    },

    startHyperbeam: async function(embedUrl, controllerName) {
        audioCtx = window.hyperbeamAudioCtx;

        if (window.hyperbeamInstances === null || window.hyperbeamInstances === undefined) {
            window.hyperbeamInstances = new Array();
        }

        //Create a hidden div for us to use
        const url = UTF8ToString(embedUrl);
        const controller = UTF8ToString(controllerName);

        console.log("starting hyperbeam from JSLIB");

        const div = document.createElement("div");
        div.style.display = "none";

        var hyperbeamInstance = {
            hyperbeamSdk: null,
            hyperbeamDiv: div,
            texture: null,
            textureId: null,
            texWidth: 0,
            texHeight: 0,
            controller: controller,
            keyDownHandler: null,
            keyUpHandler: null,
        }

        hyperbeamInstance.hyperbeamSdk = await window.Hyperbeam(div, url, {
            delegateKeyboard: false,
            frameCb: function (frame) {
                if (frame.constructor === HTMLVideoElement) {
                    hyperbeamInstance.texWidth = div.width = frame.videoWidth;
                    hyperbeamInstance.texHeight = div.height = frame.videoHeight;
                } else {
                    hyperbeamInstance.texWidth = div.width = frame.width;
                    hyperbeamInstance.texHeight = div.height = frame.height;
                }

                if(!hyperbeamInstance.texture) {
                    hyperbeamInstance.texture = GLctx.createTexture();
                    
                    hyperbeamInstance.textureId = GL.getNewId(GL.textures);
                    hyperbeamInstance.texture.name = hyperbeamInstance.textureId;
                    GL.textures[hyperbeamInstance.textureId] = hyperbeamInstance.texture;

                    GLctx.bindTexture(GLctx.TEXTURE_2D, hyperbeamInstance.texture);
                    GLctx.texStorage2D(GLctx.TEXTURE_2D, 1, GLctx.RGBA8, div.width, div.height);
    
                    GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_MIN_FILTER, GLctx.LINEAR);
    
                    GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_S, GLctx.CLAMP_TO_EDGE);
                    GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_T, GLctx.CLAMP_TO_EDGE);
    
                    GLctx.activeTexture(GLctx.TEXTURE0);
                } else {
                    GLctx.bindTexture(GLctx.TEXTURE_2D, hyperbeamInstance.texture);
                }

                GLctx.texSubImage2D(GLctx.TEXTURE_2D, 0, 0, 0, GLctx.RGBA, GLctx.UNSIGNED_BYTE, frame);
            },
        })

        const newId = window.hyperbeamInstances.length;
        window.hyperbeamInstances.push(hyperbeamInstance);

        console.log("New hyperbeam instance started at id " + newId);

        unityInstance.SendMessage(hyperbeamInstance.controller, "HyperbeamCallback", newId);
    },

    destroyInstance: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        const instance = window.hyperbeamInstances[instanceId];
        instance.hyperbeamSdk.destroy();
        instance.hyperbeamDiv.remove();
        window.hyperbeamInstances[instanceId] = null;
    },

    // this function can be successfully called after connect and can be used to grab the browser texture
    getTextureId: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return 0;
        }
        console.log("getTextureId called");

        return window.hyperbeamInstances[instanceId].textureId;
    },

    getTextureWidth: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return 0;
        }

        return window.hyperbeamInstances[instanceId].texWidth;
    },

    getTextureHeight: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return 0;
        }

        return window.hyperbeamInstances[instanceId].texHeight;
    },

    sendKeyEvent: function(instanceId, eventType, key, ctrl, meta) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        var keyEvent = {
            type: UTF8ToString(eventType),
            key: UTF8ToString(key),
            ctrlKey: ctrl,
            metaKey: meta
        }

        window.hyperbeamInstances[instanceId].hyperbeamSdk.sendEvent(keyEvent);
    },

    sendMouseEvent: function(instanceId, eventType, x, y, button) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        var mouseEvent = {
            type: UTF8ToString(eventType),
            x: x,
            y: y,
            button: button,
        }

        window.hyperbeamInstances[instanceId].hyperbeamSdk.sendEvent(mouseEvent);
    },

    sendWheelEvent: function(instanceId, deltaY) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        var wheelEvent = {
            type: "wheel",
            deltaY: deltaY,
        }

        window.hyperbeamInstances[instanceId].hyperbeamSdk.sendEvent(wheelEvent);
    },

    getVolume: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return 0;
        }

        return window.hyperbeamInstances[instanceId].hyperbeamSdk.volume;
    },

    setVolume: function(instanceId, newVolume) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        window.hyperbeamInstances[instanceId].hyperbeamSdk.volume = newVolume;
    },

    setPause: function(instanceId, pause) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            return;
        }

        window.hyperbeamInstances[instanceId].hyperbeamSdk.videoPaused = pause;
    },

    giveHyperbeamControl: function(instanceId, closeKey, ctrl, meta, alt, shift) {
        console.log("giveHyperbeamControl called for ID: " + instanceId);
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) { 
            console.log("unable to find hyperbeam instance " + instanceId);
            return;
        }

        console.log("Control received by hyperbeam on instance: " + instanceId);
        const instance = window.hyperbeamInstances[instanceId]; 
        
        if (instance.keyDownHandler || instance.keyUpHandler) {
            console.log("Hyperbeam already has control");
            return;
        }
        
        const translatedKey = UTF8ToString(closeKey);

        const keyupHandler = (event) => {
            instance.hyperbeamSdk.sendEvent({
                type: 'keyup',
                key: event.key,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
            });
        }

        const keydownHandler = (event) => {
            if(event.key === translatedKey
                && event.ctrlKey == ctrl
                && event.metaKey == meta
                && event.shiftKey == shift
                && event.altKey == alt) {
                console.log("cancel sequence found...");
                window.removeEventListener('keydown', keydownHandler, {passive: true});
                window.removeEventListener('keyup', keyupHandler, {passive: true});
                unityInstance.SendMessage(instance.controller, "ReceiveControlFromBrowser");
                return;
            }

            instance.hyperbeamSdk.sendEvent({
                type: 'keydown',
                key: event.key,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
            });
        }
        
        instance.keyDownHandler = keydownHandler;
        instance.keyUpHandler = keyupHandler;

        console.log("Adding handlers...");
        // Name the handlers so they can be removed later
        window.addEventListener('keydown', keydownHandler, {passive: true});
        window.addEventListener('keyup', keyupHandler, {passive: true});
    },
    
    giveUpControl: function(instanceId) {
        if(window.hyperbeamInstances === undefined || !window.hyperbeamInstances[instanceId]) {
            console.log("unable to find hyperbeam instance " + instanceId);
            return;
        }
        
        const instance = window.hyperbeamInstances[instanceId];
        
        if (instance.keyUpHandler) {
            window.removeEventListener('keyup', instance.keyUpHandler, {passive: true});
            instance.keyUpHandler = null;
        }
        
        if (instance.keyDownHandler) {
            window.removeEventListener('keydown', instance.keyDownHandler, {passive: true});
            instance.keyDownHandler = null;
        }
    }
})