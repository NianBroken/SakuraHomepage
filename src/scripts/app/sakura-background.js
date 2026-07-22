(function (window, document) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});
    var activeController = null;

    var SHADERS = {
        sakuraPointVertex: [
            "uniform mat4 uProjection;",
            "uniform mat4 uModelview;",
            "uniform vec3 uResolution;",
            "uniform vec3 uOffset;",
            "uniform vec3 uDOF;",
            "uniform vec3 uFade;",
            "",
            "attribute vec3 aPosition;",
            "attribute vec3 aEuler;",
            "attribute vec2 aMisc;",
            "",
            "varying vec3 pposition;",
            "varying float psize;",
            "varying float palpha;",
            "varying float pdist;",
            "varying vec3 normX;",
            "varying vec3 normY;",
            "varying vec3 normZ;",
            "varying vec3 normal;",
            "varying float diffuse;",
            "varying float specular;",
            "varying float rstop;",
            "varying float distancefade;",
            "",
            "void main(void) {",
            "    vec4 pos = uModelview * vec4(aPosition + uOffset, 1.0);",
            "    gl_Position = uProjection * pos;",
            "    gl_PointSize = aMisc.x * uProjection[1][1] / -pos.z * uResolution.y * 0.5;",
            "",
            "    pposition = pos.xyz;",
            "    psize = aMisc.x;",
            "    pdist = length(pos.xyz);",
            "    palpha = smoothstep(0.0, 1.0, (pdist - 0.1) / uFade.z);",
            "",
            "    vec3 elrsn = sin(aEuler);",
            "    vec3 elrcs = cos(aEuler);",
            "    mat3 rotx = mat3(",
            "        1.0, 0.0, 0.0,",
            "        0.0, elrcs.x, elrsn.x,",
            "        0.0, -elrsn.x, elrcs.x",
            "    );",
            "    mat3 roty = mat3(",
            "        elrcs.y, 0.0, -elrsn.y,",
            "        0.0, 1.0, 0.0,",
            "        elrsn.y, 0.0, elrcs.y",
            "    );",
            "    mat3 rotz = mat3(",
            "        elrcs.z, elrsn.z, 0.0,",
            "        -elrsn.z, elrcs.z, 0.0,",
            "        0.0, 0.0, 1.0",
            "    );",
            "    mat3 rotmat = rotx * roty * rotz;",
            "    normal = rotmat[2];",
            "",
            "    mat3 trrotm = mat3(",
            "        rotmat[0][0], rotmat[1][0], rotmat[2][0],",
            "        rotmat[0][1], rotmat[1][1], rotmat[2][1],",
            "        rotmat[0][2], rotmat[1][2], rotmat[2][2]",
            "    );",
            "    normX = trrotm[0];",
            "    normY = trrotm[1];",
            "    normZ = trrotm[2];",
            "",
            "    const vec3 lit = vec3(0.6917144638660746, 0.6917144638660746, -0.20751433915982237);",
            "    float tmpdfs = dot(lit, normal);",
            "",
            "    if (tmpdfs < 0.0) {",
            "        normal = -normal;",
            "        tmpdfs = dot(lit, normal);",
            "    }",
            "",
            "    diffuse = 0.4 + tmpdfs;",
            "",
            "    vec3 eyev = normalize(-pos.xyz);",
            "    if (dot(eyev, normal) > 0.0) {",
            "        vec3 hv = normalize(eyev + lit);",
            "        specular = pow(max(dot(hv, normal), 0.0), 20.0);",
            "    } else {",
            "        specular = 0.0;",
            "    }",
            "",
            "    rstop = clamp((abs(pdist - uDOF.x) - uDOF.y) / uDOF.z, 0.0, 1.0);",
            "    rstop = pow(rstop, 0.5);",
            "    distancefade = min(1.0, exp((uFade.x - pdist) * 0.69315 / uFade.y));",
            "}"
        ].join("\n"),
        sakuraPointFragment: [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "uniform vec3 uDOF;",
            "uniform vec3 uFade;",
            "",
            "const vec3 fadeCol = vec3(0.08, 0.03, 0.06);",
            "",
            "varying vec3 pposition;",
            "varying float psize;",
            "varying float palpha;",
            "varying float pdist;",
            "varying vec3 normX;",
            "varying vec3 normY;",
            "varying vec3 normZ;",
            "varying vec3 normal;",
            "varying float diffuse;",
            "varying float specular;",
            "varying float rstop;",
            "varying float distancefade;",
            "",
            "float ellipse(vec2 p, vec2 o, vec2 r) {",
            "    vec2 lp = (p - o) / r;",
            "    return length(lp) - 1.0;",
            "}",
            "",
            "void main(void) {",
            "    vec3 p = vec3(gl_PointCoord - vec2(0.5, 0.5), 0.0) * 2.0;",
            "    vec3 d = vec3(0.0, 0.0, -1.0);",
            "    float nd = normZ.z;",
            "",
            "    if (abs(nd) < 0.0001) discard;",
            "",
            "    float np = dot(normZ, p);",
            "    vec3 tp = p + d * np / nd;",
            "    vec2 coord = vec2(dot(normX, tp), dot(normY, tp));",
            "",
            "    const float flwrsn = 0.258819045102521;",
            "    const float flwrcs = 0.965925826289068;",
            "    mat2 flwrm = mat2(flwrcs, -flwrsn, flwrsn, flwrcs);",
            "    vec2 flwrp = vec2(abs(coord.x), coord.y) * flwrm;",
            "",
            "    float r;",
            "    if (flwrp.x < 0.0) {",
            "        r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.36, 0.96) * 0.5);",
            "    } else {",
            "        r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.58, 0.96) * 0.5);",
            "    }",
            "",
            "    if (r > rstop) discard;",
            "",
            "    vec3 col = mix(vec3(1.0, 0.8, 0.75), vec3(1.0, 0.9, 0.87), r);",
            "    float grady = mix(0.0, 1.0, pow(coord.y * 0.5 + 0.5, 0.35));",
            "    col *= vec3(1.0, grady, grady);",
            "    col *= mix(0.8, 1.0, pow(abs(coord.x), 0.3));",
            "    col = col * diffuse + specular;",
            "    col = mix(fadeCol, col, distancefade);",
            "",
            "    float alpha = (rstop > 0.001) ? (0.5 - r / (rstop * 2.0)) : 1.0;",
            "    alpha = smoothstep(0.0, 1.0, alpha) * palpha;",
            "",
            "    gl_FragColor = vec4(col * 0.5, alpha);",
            "}"
        ].join("\n"),
        fxCommonVertex: [
            "uniform vec3 uResolution;",
            "attribute vec2 aPosition;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    gl_Position = vec4(aPosition, 0.0, 1.0);",
            "    texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5);",
            "    screenCoord = aPosition.xy * vec2(uResolution.z, 1.0);",
            "}"
        ].join("\n"),
        backgroundFragment: [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "uniform vec2 uTimes;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    vec3 col;",
            "    float c;",
            "    vec2 tmpv = texCoord * vec2(0.8, 1.0) - vec2(0.95, 1.0);",
            "    c = exp(-pow(length(tmpv) * 1.8, 2.0));",
            "    col = mix(vec3(0.02, 0.0, 0.03), vec3(0.96, 0.98, 1.0) * 1.5, c);",
            "    gl_FragColor = vec4(col * 0.5, 1.0);",
            "}"
        ].join("\n"),
        brightBufferFragment: [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "uniform sampler2D uSrc;",
            "uniform vec2 uDelta;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    vec4 col = texture2D(uSrc, texCoord);",
            "    gl_FragColor = vec4(col.rgb * 2.0 - vec3(0.5), 1.0);",
            "}"
        ].join("\n"),
        directionalBlurFragment: [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "uniform sampler2D uSrc;",
            "uniform vec2 uDelta;",
            "uniform vec4 uBlurDir;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    vec4 col = texture2D(uSrc, texCoord);",
            "    col = col + texture2D(uSrc, texCoord + uBlurDir.xy * uDelta);",
            "    col = col + texture2D(uSrc, texCoord - uBlurDir.xy * uDelta);",
            "    col = col + texture2D(uSrc, texCoord + (uBlurDir.xy + uBlurDir.zw) * uDelta);",
            "    col = col + texture2D(uSrc, texCoord - (uBlurDir.xy + uBlurDir.zw) * uDelta);",
            "    gl_FragColor = col / 5.0;",
            "}"
        ].join("\n"),
        finalCompositeVertex: [
            "uniform vec3 uResolution;",
            "attribute vec2 aPosition;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    gl_Position = vec4(aPosition, 0.0, 1.0);",
            "    texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5);",
            "    screenCoord = aPosition.xy * vec2(uResolution.z, 1.0);",
            "}"
        ].join("\n"),
        finalCompositeFragment: [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "uniform sampler2D uSrc;",
            "uniform sampler2D uBloom;",
            "uniform vec2 uDelta;",
            "",
            "varying vec2 texCoord;",
            "varying vec2 screenCoord;",
            "",
            "void main(void) {",
            "    vec4 srccol = texture2D(uSrc, texCoord) * 2.0;",
            "    vec4 bloomcol = texture2D(uBloom, texCoord);",
            "    vec4 col = srccol + bloomcol * (vec4(1.0) + srccol);",
            "    col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5);",
            "    col = pow(col, vec4(0.45454545454545));",
            "    gl_FragColor = vec4(col.rgb, 1.0);",
            "    gl_FragColor.a = 1.0;",
            "}"
        ].join("\n")
    };

    var Vector3 = {
        create: function (x, y, z) {
            return {
                x: x,
                y: y,
                z: z
            };
        },
        dot: function (v0, v1) {
            return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
        },
        cross: function (target, v0, v1) {
            target.x = v0.y * v1.z - v0.z * v1.y;
            target.y = v0.z * v1.x - v0.x * v1.z;
            target.z = v0.x * v1.y - v0.y * v1.x;
        },
        normalize: function (vector) {
            var length = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;

            if (length > 0.00001) {
                length = 1.0 / Math.sqrt(length);
                vector.x *= length;
                vector.y *= length;
                vector.z *= length;
            }
        },
        arrayForm: function (vector) {
            if (!vector.array) {
                vector.array = new Float32Array([vector.x, vector.y, vector.z]);
            } else {
                vector.array[0] = vector.x;
                vector.array[1] = vector.y;
                vector.array[2] = vector.z;
            }

            return vector.array;
        }
    };

    var Matrix44 = {
        createIdentity: function () {
            return new Float32Array([
                1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            ]);
        },
        loadProjection: function (matrix, aspect, vdeg, near, far) {
            var height = near * Math.tan(vdeg * Math.PI / 180.0 * 0.5) * 2.0;
            var width = height * aspect;

            matrix[0] = 2.0 * near / width;
            matrix[1] = 0.0;
            matrix[2] = 0.0;
            matrix[3] = 0.0;
            matrix[4] = 0.0;
            matrix[5] = 2.0 * near / height;
            matrix[6] = 0.0;
            matrix[7] = 0.0;
            matrix[8] = 0.0;
            matrix[9] = 0.0;
            matrix[10] = -(far + near) / (far - near);
            matrix[11] = -1.0;
            matrix[12] = 0.0;
            matrix[13] = 0.0;
            matrix[14] = -2.0 * far * near / (far - near);
            matrix[15] = 0.0;
        },
        loadLookAt: function (matrix, vpos, vlook, vup) {
            var front = Vector3.create(vpos.x - vlook.x, vpos.y - vlook.y, vpos.z - vlook.z);
            var side = Vector3.create(1.0, 0.0, 0.0);
            var top = Vector3.create(1.0, 0.0, 0.0);

            Vector3.normalize(front);
            Vector3.cross(side, vup, front);
            Vector3.normalize(side);
            Vector3.cross(top, front, side);
            Vector3.normalize(top);

            matrix[0] = side.x;
            matrix[1] = top.x;
            matrix[2] = front.x;
            matrix[3] = 0.0;
            matrix[4] = side.y;
            matrix[5] = top.y;
            matrix[6] = front.y;
            matrix[7] = 0.0;
            matrix[8] = side.z;
            matrix[9] = top.z;
            matrix[10] = front.z;
            matrix[11] = 0.0;
            matrix[12] = -(vpos.x * matrix[0] + vpos.y * matrix[4] + vpos.z * matrix[8]);
            matrix[13] = -(vpos.x * matrix[1] + vpos.y * matrix[5] + vpos.z * matrix[9]);
            matrix[14] = -(vpos.x * matrix[2] + vpos.y * matrix[6] + vpos.z * matrix[10]);
            matrix[15] = 1.0;
        }
    };

    function BlossomParticle() {
        this.velocity = new Array(3);
        this.rotation = new Array(3);
        this.position = new Array(3);
        this.euler = new Array(3);
        this.size = 1.0;
        this.alpha = 1.0;
        this.zkey = 0.0;
    }

    BlossomParticle.prototype.setVelocity = function (vx, vy, vz) {
        this.velocity[0] = vx;
        this.velocity[1] = vy;
        this.velocity[2] = vz;
    };

    BlossomParticle.prototype.setRotation = function (rx, ry, rz) {
        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;
    };

    BlossomParticle.prototype.setPosition = function (nx, ny, nz) {
        this.position[0] = nx;
        this.position[1] = ny;
        this.position[2] = nz;
    };

    BlossomParticle.prototype.setEulerAngles = function (rx, ry, rz) {
        this.euler[0] = rx;
        this.euler[1] = ry;
        this.euler[2] = rz;
    };

    BlossomParticle.prototype.setSize = function (size) {
        this.size = size;
    };

    BlossomParticle.prototype.update = function (deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        this.euler[0] += this.rotation[0] * deltaTime;
        this.euler[1] += this.rotation[1] * deltaTime;
        this.euler[2] += this.rotation[2] * deltaTime;
    };

    function createController(options) {
        var canvas = options.canvas;
        var fallbackColor = options.fallbackColor || "rgb(44, 44, 46)";
        var rafId = 0;
        var animating = false;
        var disposed = false;
        var gl = null;
        var pointFlower = {};
        var effectLib = {};
        var timeInfo = {
            start: 0,
            prev: 0,
            delta: 0,
            elapsed: 0
        };
        var renderSpec = {
            width: 0,
            height: 0,
            aspect: 1,
            array: new Float32Array(3),
            halfWidth: 0,
            halfHeight: 0,
            halfArray: new Float32Array(3)
        };
        var projection = {
            angle: 60,
            nearfar: new Float32Array([0.1, 100.0]),
            matrix: Matrix44.createIdentity()
        };
        var camera = {
            position: Vector3.create(0, 0, 100),
            lookat: Vector3.create(0, 0, 0),
            up: Vector3.create(0, 1, 0),
            dof: Vector3.create(10.0, 4.0, 8.0),
            matrix: Matrix44.createIdentity()
        };
        function setFallbackAppearance() {
            canvas.classList.add("is-hidden");
            document.body.style.backgroundColor = fallbackColor;
        }

        function clearFallbackAppearance() {
            canvas.classList.remove("is-hidden");
            document.body.style.backgroundColor = "";
        }

        renderSpec.setSize = function (width, height) {
            renderSpec.width = width;
            renderSpec.height = height;
            renderSpec.aspect = renderSpec.width / renderSpec.height;
            renderSpec.array[0] = renderSpec.width;
            renderSpec.array[1] = renderSpec.height;
            renderSpec.array[2] = renderSpec.aspect;
            renderSpec.halfWidth = Math.max(1, Math.floor(width / 2));
            renderSpec.halfHeight = Math.max(1, Math.floor(height / 2));
            renderSpec.halfArray[0] = renderSpec.halfWidth;
            renderSpec.halfArray[1] = renderSpec.halfHeight;
            renderSpec.halfArray[2] = renderSpec.halfWidth / renderSpec.halfHeight;
        };

        function deleteRenderTarget(target) {
            if (!target || !gl) {
                return;
            }

            if (target.frameBuffer) {
                gl.deleteFramebuffer(target.frameBuffer);
            }
            if (target.renderBuffer) {
                gl.deleteRenderbuffer(target.renderBuffer);
            }
            if (target.texture) {
                gl.deleteTexture(target.texture);
            }
        }

        function createRenderTarget(width, height) {
            var target = {
                width: width,
                height: height,
                sizeArray: new Float32Array([width, height, width / height]),
                dtxArray: new Float32Array([1.0 / width, 1.0 / height])
            };

            target.frameBuffer = gl.createFramebuffer();
            target.renderBuffer = gl.createRenderbuffer();
            target.texture = gl.createTexture();

            if (!target.frameBuffer || !target.renderBuffer || !target.texture) {
                deleteRenderTarget(target);
                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, target.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.bindFramebuffer(gl.FRAMEBUFFER, target.frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);

            gl.bindRenderbuffer(gl.RENDERBUFFER, target.renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.renderBuffer);

            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                deleteRenderTarget(target);
                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return target;
        }

        function compileShader(shaderType, source) {
            var shader = gl.createShader(shaderType);

            if (!shader) {
                return null;
            }

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        function createShader(vertexSource, fragmentSource, uniformList, attributeList) {
            var vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
            var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
            var program;
            var index;

            if (!vertexShader || !fragmentShader) {
                if (vertexShader) {
                    gl.deleteShader(vertexShader);
                }
                if (fragmentShader) {
                    gl.deleteShader(fragmentShader);
                }
                return null;
            }

            program = gl.createProgram();
            if (!program) {
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                return null;
            }

            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                gl.deleteProgram(program);
                return null;
            }

            program.uniforms = {};
            program.attributes = {};

            if (uniformList) {
                for (index = 0; index < uniformList.length; index += 1) {
                    program.uniforms[uniformList[index]] = gl.getUniformLocation(program, uniformList[index]);
                }
            }

            if (attributeList) {
                for (index = 0; index < attributeList.length; index += 1) {
                    program.attributes[attributeList[index]] = gl.getAttribLocation(program, attributeList[index]);
                }
            }

            return program;
        }

        function useShader(program) {
            var attributeName;

            gl.useProgram(program);

            for (attributeName in program.attributes) {
                if (Object.prototype.hasOwnProperty.call(program.attributes, attributeName)) {
                    gl.enableVertexAttribArray(program.attributes[attributeName]);
                }
            }
        }

        function unuseShader(program) {
            var attributeName;

            if (!program) {
                return;
            }

            for (attributeName in program.attributes) {
                if (Object.prototype.hasOwnProperty.call(program.attributes, attributeName)) {
                    gl.disableVertexAttribArray(program.attributes[attributeName]);
                }
            }

            gl.useProgram(null);
        }

        function deleteProgram(program) {
            if (program) {
                gl.deleteProgram(program);
            }
        }

        function createPointFlowers() {
            var pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
            var index;

            renderSpec.pointSize = {
                min: pointSizeRange[0],
                max: pointSizeRange[1]
            };

            pointFlower.program = createShader(
                SHADERS.sakuraPointVertex,
                SHADERS.sakuraPointFragment,
                ["uProjection", "uModelview", "uResolution", "uOffset", "uDOF", "uFade"],
                ["aPosition", "aEuler", "aMisc"]
            );

            if (!pointFlower.program) {
                return false;
            }

            useShader(pointFlower.program);

            pointFlower.offset = new Float32Array([0.0, 0.0, 0.0]);
            pointFlower.fader = Vector3.create(0.0, 10.0, 0.0);
            pointFlower.numFlowers = 1600;
            pointFlower.particles = new Array(pointFlower.numFlowers);
            pointFlower.dataArray = new Float32Array(pointFlower.numFlowers * (3 + 3 + 2));
            pointFlower.positionArrayOffset = 0;
            pointFlower.eulerArrayOffset = pointFlower.numFlowers * 3;
            pointFlower.miscArrayOffset = pointFlower.numFlowers * 6;
            pointFlower.buffer = gl.createBuffer();

            if (!pointFlower.buffer) {
                unuseShader(pointFlower.program);
                return false;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, pointFlower.dataArray, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            unuseShader(pointFlower.program);

            for (index = 0; index < pointFlower.numFlowers; index += 1) {
                pointFlower.particles[index] = new BlossomParticle();
            }

            return true;
        }

        function initPointFlowers() {
            var pi2 = Math.PI * 2.0;
            var tempVector = Vector3.create(0, 0, 0);
            var tempValue = 0;
            var index;
            var particle;

            function symmetryRand() {
                return Math.random() * 2.0 - 1.0;
            }

            pointFlower.area = Vector3.create(20.0, 20.0, 20.0);
            pointFlower.area.x = pointFlower.area.y * renderSpec.aspect;
            pointFlower.fader.x = 10.0;
            pointFlower.fader.y = pointFlower.area.z;
            pointFlower.fader.z = 0.1;

            for (index = 0; index < pointFlower.numFlowers; index += 1) {
                particle = pointFlower.particles[index];

                tempVector.x = symmetryRand() * 0.3 + 0.8;
                tempVector.y = symmetryRand() * 0.2 - 1.0;
                tempVector.z = symmetryRand() * 0.3 + 0.5;
                Vector3.normalize(tempVector);
                tempValue = 2.0 + Math.random() * 1.0;
                particle.setVelocity(tempVector.x * tempValue, tempVector.y * tempValue, tempVector.z * tempValue);
                particle.setRotation(
                    symmetryRand() * pi2 * 0.5,
                    symmetryRand() * pi2 * 0.5,
                    symmetryRand() * pi2 * 0.5
                );
                particle.setPosition(
                    symmetryRand() * pointFlower.area.x,
                    symmetryRand() * pointFlower.area.y,
                    symmetryRand() * pointFlower.area.z
                );
                particle.setEulerAngles(
                    Math.random() * Math.PI * 2.0,
                    Math.random() * Math.PI * 2.0,
                    Math.random() * Math.PI * 2.0
                );
                particle.setSize(0.9 + Math.random() * 0.1);
            }
        }

        function renderPointFlowers() {
            var pi2 = Math.PI * 2.0;
            var limits = [pointFlower.area.x, pointFlower.area.y, pointFlower.area.z];
            var index;
            var particle;
            var positionIndex = pointFlower.positionArrayOffset;
            var eulerIndex = pointFlower.eulerArrayOffset;
            var miscIndex = pointFlower.miscArrayOffset;
            var program = pointFlower.program;

            function repeatPosition(target, axisIndex, limit) {
                if (Math.abs(target.position[axisIndex]) - target.size * 0.5 > limit) {
                    if (target.position[axisIndex] > 0) {
                        target.position[axisIndex] -= limit * 2.0;
                    } else {
                        target.position[axisIndex] += limit * 2.0;
                    }
                }
            }

            function repeatEuler(target, axisIndex) {
                target.euler[axisIndex] = target.euler[axisIndex] % pi2;
                if (target.euler[axisIndex] < 0.0) {
                    target.euler[axisIndex] += pi2;
                }
            }

            for (index = 0; index < pointFlower.numFlowers; index += 1) {
                particle = pointFlower.particles[index];
                particle.update(timeInfo.delta);
                repeatPosition(particle, 0, limits[0]);
                repeatPosition(particle, 1, limits[1]);
                repeatPosition(particle, 2, limits[2]);
                repeatEuler(particle, 0);
                repeatEuler(particle, 1);
                repeatEuler(particle, 2);
                particle.alpha = 1.0;
                particle.zkey = (
                    camera.matrix[2] * particle.position[0] +
                    camera.matrix[6] * particle.position[1] +
                    camera.matrix[10] * particle.position[2] +
                    camera.matrix[14]
                );
            }

            pointFlower.particles.sort(function (first, second) {
                return first.zkey - second.zkey;
            });

            for (index = 0; index < pointFlower.numFlowers; index += 1) {
                particle = pointFlower.particles[index];
                pointFlower.dataArray[positionIndex] = particle.position[0];
                pointFlower.dataArray[positionIndex + 1] = particle.position[1];
                pointFlower.dataArray[positionIndex + 2] = particle.position[2];
                positionIndex += 3;
                pointFlower.dataArray[eulerIndex] = particle.euler[0];
                pointFlower.dataArray[eulerIndex + 1] = particle.euler[1];
                pointFlower.dataArray[eulerIndex + 2] = particle.euler[2];
                eulerIndex += 3;
                pointFlower.dataArray[miscIndex] = particle.size;
                pointFlower.dataArray[miscIndex + 1] = particle.alpha;
                miscIndex += 2;
            }

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            useShader(program);
            gl.uniformMatrix4fv(program.uniforms.uProjection, false, projection.matrix);
            gl.uniformMatrix4fv(program.uniforms.uModelview, false, camera.matrix);
            gl.uniform3fv(program.uniforms.uResolution, renderSpec.array);
            gl.uniform3fv(program.uniforms.uDOF, Vector3.arrayForm(camera.dof));
            gl.uniform3fv(program.uniforms.uFade, Vector3.arrayForm(pointFlower.fader));
            gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, pointFlower.dataArray, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(
                program.attributes.aPosition,
                3,
                gl.FLOAT,
                false,
                0,
                pointFlower.positionArrayOffset * Float32Array.BYTES_PER_ELEMENT
            );
            gl.vertexAttribPointer(
                program.attributes.aEuler,
                3,
                gl.FLOAT,
                false,
                0,
                pointFlower.eulerArrayOffset * Float32Array.BYTES_PER_ELEMENT
            );
            gl.vertexAttribPointer(
                program.attributes.aMisc,
                2,
                gl.FLOAT,
                false,
                0,
                pointFlower.miscArrayOffset * Float32Array.BYTES_PER_ELEMENT
            );

            for (index = 1; index < 2; index += 1) {
                var zPosition = index * -2.0;

                pointFlower.offset[0] = pointFlower.area.x * -1.0;
                pointFlower.offset[1] = pointFlower.area.y * -1.0;
                pointFlower.offset[2] = pointFlower.area.z * zPosition;
                gl.uniform3fv(program.uniforms.uOffset, pointFlower.offset);
                gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

                pointFlower.offset[0] = pointFlower.area.x * -1.0;
                pointFlower.offset[1] = pointFlower.area.y * 1.0;
                pointFlower.offset[2] = pointFlower.area.z * zPosition;
                gl.uniform3fv(program.uniforms.uOffset, pointFlower.offset);
                gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

                pointFlower.offset[0] = pointFlower.area.x * 1.0;
                pointFlower.offset[1] = pointFlower.area.y * -1.0;
                pointFlower.offset[2] = pointFlower.area.z * zPosition;
                gl.uniform3fv(program.uniforms.uOffset, pointFlower.offset);
                gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

                pointFlower.offset[0] = pointFlower.area.x * 1.0;
                pointFlower.offset[1] = pointFlower.area.y * 1.0;
                pointFlower.offset[2] = pointFlower.area.z * zPosition;
                gl.uniform3fv(program.uniforms.uOffset, pointFlower.offset);
                gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);
            }

            pointFlower.offset[0] = 0.0;
            pointFlower.offset[1] = 0.0;
            pointFlower.offset[2] = 0.0;
            gl.uniform3fv(program.uniforms.uOffset, pointFlower.offset);
            gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            unuseShader(program);
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
        }

        function createEffectProgram(vertexSource, fragmentSource, extraUniforms, extraAttributes) {
            var uniformList = ["uResolution", "uSrc", "uDelta"];
            var attributeList = ["aPosition"];
            var effect = {};

            if (extraUniforms) {
                uniformList = uniformList.concat(extraUniforms);
            }
            if (extraAttributes) {
                attributeList = attributeList.concat(extraAttributes);
            }

            effect.program = createShader(vertexSource, fragmentSource, uniformList, attributeList);
            if (!effect.program) {
                return null;
            }

            useShader(effect.program);
            effect.dataArray = new Float32Array([
                -1.0, -1.0,
                1.0, -1.0,
                -1.0, 1.0,
                1.0, 1.0
            ]);
            effect.buffer = gl.createBuffer();

            if (!effect.buffer) {
                unuseShader(effect.program);
                return null;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, effect.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, effect.dataArray, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            unuseShader(effect.program);

            return effect;
        }

        function useEffect(effect, sourceTexture) {
            var program = effect.program;

            useShader(program);
            gl.uniform3fv(program.uniforms.uResolution, renderSpec.array);

            if (sourceTexture) {
                gl.uniform2fv(program.uniforms.uDelta, sourceTexture.dtxArray);
                gl.uniform1i(program.uniforms.uSrc, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, sourceTexture.texture);
            }
        }

        function drawEffect(effect) {
            gl.bindBuffer(gl.ARRAY_BUFFER, effect.buffer);
            gl.vertexAttribPointer(effect.program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        function unuseEffect(effect) {
            unuseShader(effect.program);
        }

        function createEffectLib() {
            effectLib.sceneBg = createEffectProgram(
                SHADERS.fxCommonVertex,
                SHADERS.backgroundFragment,
                ["uTimes"],
                null
            );
            effectLib.mkBrightBuf = createEffectProgram(
                SHADERS.fxCommonVertex,
                SHADERS.brightBufferFragment,
                null,
                null
            );
            effectLib.dirBlur = createEffectProgram(
                SHADERS.fxCommonVertex,
                SHADERS.directionalBlurFragment,
                ["uBlurDir"],
                null
            );
            effectLib.finalComp = createEffectProgram(
                SHADERS.finalCompositeVertex,
                SHADERS.finalCompositeFragment,
                ["uBloom"],
                null
            );

            return !!(
                effectLib.sceneBg &&
                effectLib.mkBrightBuf &&
                effectLib.dirBlur &&
                effectLib.finalComp
            );
        }

        function renderBackground() {
            gl.disable(gl.DEPTH_TEST);
            useEffect(effectLib.sceneBg, null);
            gl.uniform2f(effectLib.sceneBg.program.uniforms.uTimes, timeInfo.elapsed, timeInfo.delta);
            drawEffect(effectLib.sceneBg);
            unuseEffect(effectLib.sceneBg);
            gl.enable(gl.DEPTH_TEST);
        }

        function renderPostProcess() {
            function bindTarget(target, shouldClear) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.frameBuffer);
                gl.viewport(0, 0, target.width, target.height);

                if (shouldClear) {
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                }
            }

            gl.disable(gl.DEPTH_TEST);

            bindTarget(renderSpec.wHalfRT0, true);
            useEffect(effectLib.mkBrightBuf, renderSpec.mainRT);
            drawEffect(effectLib.mkBrightBuf);
            unuseEffect(effectLib.mkBrightBuf);

            for (var index = 0; index < 2; index += 1) {
                var position = 1.5 + index;
                var stride = 2.0 + index;

                bindTarget(renderSpec.wHalfRT1, true);
                useEffect(effectLib.dirBlur, renderSpec.wHalfRT0);
                gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir, position, 0.0, stride, 0.0);
                drawEffect(effectLib.dirBlur);
                unuseEffect(effectLib.dirBlur);

                bindTarget(renderSpec.wHalfRT0, true);
                useEffect(effectLib.dirBlur, renderSpec.wHalfRT1);
                gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir, 0.0, position, 0.0, stride);
                drawEffect(effectLib.dirBlur);
                unuseEffect(effectLib.dirBlur);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, renderSpec.width, renderSpec.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            useEffect(effectLib.finalComp, renderSpec.mainRT);
            gl.uniform1i(effectLib.finalComp.program.uniforms.uBloom, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, renderSpec.wHalfRT0.texture);
            drawEffect(effectLib.finalComp);
            unuseEffect(effectLib.finalComp);
            gl.activeTexture(gl.TEXTURE0);
            gl.enable(gl.DEPTH_TEST);
        }

        function createScene() {
            if (!createEffectLib()) {
                return false;
            }

            return createPointFlowers();
        }

        function initScene() {
            initPointFlowers();
            camera.position.z = pointFlower.area.z + projection.nearfar[0];
            projection.angle = Math.atan2(pointFlower.area.y, camera.position.z + pointFlower.area.z) * 180.0 / Math.PI * 2.0;
            Matrix44.loadProjection(
                projection.matrix,
                renderSpec.aspect,
                projection.angle,
                projection.nearfar[0],
                projection.nearfar[1]
            );
        }

        function renderScene() {
            Matrix44.loadLookAt(camera.matrix, camera.position, camera.lookat, camera.up);
            gl.enable(gl.DEPTH_TEST);
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.mainRT.frameBuffer);
            gl.viewport(0, 0, renderSpec.mainRT.width, renderSpec.mainRT.height);
            gl.clearColor(0.005, 0, 0.05, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderBackground();
            renderPointFlowers();
            renderPostProcess();
        }

        function makeCanvasFullScreen(targetCanvas) {
            targetCanvas.width = Math.max(1, window.innerWidth);
            targetCanvas.height = Math.max(1, window.innerHeight);
        }

        function setViewports() {
            var target;

            renderSpec.setSize(gl.canvas.width, gl.canvas.height);
            gl.clearColor(0.2, 0.2, 0.5, 1.0);
            gl.viewport(0, 0, renderSpec.width, renderSpec.height);

            function resetRenderTarget(name, width, height) {
                var current = renderSpec[name];

                if (current) {
                    deleteRenderTarget(current);
                }

                target = createRenderTarget(width, height);
                if (!target) {
                    return false;
                }

                renderSpec[name] = target;
                return true;
            }

            return (
                resetRenderTarget("mainRT", renderSpec.width, renderSpec.height) &&
                resetRenderTarget("wFullRT0", renderSpec.width, renderSpec.height) &&
                resetRenderTarget("wFullRT1", renderSpec.width, renderSpec.height) &&
                resetRenderTarget("wHalfRT0", renderSpec.halfWidth, renderSpec.halfHeight) &&
                resetRenderTarget("wHalfRT1", renderSpec.halfWidth, renderSpec.halfHeight)
            );
        }

        function animate() {
            var currentDate;

            if (!animating || disposed) {
                return;
            }

            currentDate = new Date();
            timeInfo.elapsed = (currentDate - timeInfo.start) / 1000.0;
            timeInfo.delta = (currentDate - timeInfo.prev) / 1000.0;
            timeInfo.prev = currentDate;

            renderScene();

            if (animating && !disposed) {
                rafId = window.requestAnimationFrame(animate);
            }
        }

        function onResize() {
            if (!gl || disposed) {
                return;
            }

            makeCanvasFullScreen(canvas);
            if (!setViewports()) {
                return;
            }
            initScene();
        }

        function deleteEffect(effect) {
            if (!effect) {
                return;
            }

            if (effect.buffer) {
                gl.deleteBuffer(effect.buffer);
            }

            deleteProgram(effect.program);
        }

        function cleanupResources() {
            if (!gl) {
                return;
            }

            if (pointFlower.buffer) {
                gl.deleteBuffer(pointFlower.buffer);
                pointFlower.buffer = null;
            }
            if (pointFlower.program) {
                deleteProgram(pointFlower.program);
                pointFlower.program = null;
            }

            deleteEffect(effectLib.sceneBg);
            deleteEffect(effectLib.mkBrightBuf);
            deleteEffect(effectLib.dirBlur);
            deleteEffect(effectLib.finalComp);
            effectLib = {};

            deleteRenderTarget(renderSpec.mainRT);
            deleteRenderTarget(renderSpec.wFullRT0);
            deleteRenderTarget(renderSpec.wFullRT1);
            deleteRenderTarget(renderSpec.wHalfRT0);
            deleteRenderTarget(renderSpec.wHalfRT1);

            renderSpec.mainRT = null;
            renderSpec.wFullRT0 = null;
            renderSpec.wFullRT1 = null;
            renderSpec.wHalfRT0 = null;
            renderSpec.wHalfRT1 = null;
        }

        function stopAnimationLoop() {
            animating = false;

            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
            }
        }

        function teardown() {
            if (disposed) {
                return;
            }

            disposed = true;
            stopAnimationLoop();
            window.removeEventListener("resize", onResize);
            cleanupResources();
            gl = null;
        }

        function start() {
            if (disposed) {
                return false;
            }

            clearFallbackAppearance();
            makeCanvasFullScreen(canvas);

            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) {
                setFallbackAppearance();
                return false;
            }

            if (!setViewports()) {
                setFallbackAppearance();
                teardown();
                return false;
            }

            if (!createScene()) {
                setFallbackAppearance();
                teardown();
                return false;
            }

            initScene();
            timeInfo.start = new Date();
            timeInfo.prev = timeInfo.start;
            animating = true;
            window.addEventListener("resize", onResize, {
                passive: true
            });
            animate();
            return true;
        }

        return {
            start: start,
            destroy: teardown
        };
    }

    function destroySakuraBackground() {
        if (activeController) {
            activeController.destroy();
            activeController = null;
        }
    }

    function startSakuraBackground(options) {
        destroySakuraBackground();
        activeController = createController(options);
        activeController.start();
        return activeController;
    }

    namespace.startSakuraBackground = startSakuraBackground;
    namespace.destroySakuraBackground = destroySakuraBackground;
})(window, document);
