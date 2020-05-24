/* eslint-disable max-depth */
/* eslint-disable complexity */

export default function () {
  var me = {
    // self.addEventListener('message', function(e) {
    //     var data = e.data;
    //     switch (data.cmd) {
    //         case 'start':
    //             var param={path:data.path,level:data.level};
    //             if(data.niigz)
    //                 param.niigz=data.niigz;
    //             init(param);
    //             break;
    //     }
    // });

    cubeEdges: new Int32Array(24), // surfacenets
    edgeTable: new Int32Array(256), // surfacenets
    buffer: new Int32Array(4096), // surfacenets
    init: function init(segmentationData) {
      me.initSurfacenets();
      const mesh = me.surfaceNets(
        segmentationData.data,
        segmentationData.dim,
        segmentationData.pixdim,
        segmentationData.level
      );

      return mesh;
    },
    initSurfacenets: function initSurfacenets() {
      // self.postMessage({msg:"initSurfacenets"});

      let i, j;
      let k = 0;
      for(i=0; i<8; ++i) {
        for(j=1; j<=4; j<<=1) {
          const p = i^j;
          if(i <= p) {
            me.cubeEdges[k++] = i;
            me.cubeEdges[k++] = p;
          }
        }
      }
      for(i=0; i<256; ++i) {
        var em = 0;
        for(j=0; j<24; j+=2) {
          var a = Boolean(i & (1<<me.cubeEdges[j]));
          var b = Boolean(i & (1<<me.cubeEdges[j+1]));
          em |= a !== b ? (1 << (j >> 1)) : 0;
        }
        me.edgeTable[i] = em;
      }
    },
    surfaceNets: function surfaceNets(data, dims, pixdims, level) {
      // self.postMessage({msg:"surfaceNets"});

      const
        faces = [],
        grid = new Float32Array(8),
        vertices = [],
        x = new Int32Array(3);
      let
        bufNo = 1,
        n = 0,
        R = new Int32Array([1, (dims[0]+1), (dims[0]+1)*(dims[1]+1)]);

      if(R[2] * 2 > me.buffer.length) {
        me.buffer = new Int32Array(R[2] * 2);
      }

      for(x[2]=0; x[2]<dims[2]-1; ++x[2], n+=dims[0], bufNo ^= 1, R[2]=-R[2]) {
        var m = 1 + (dims[0]+1) * (1 + bufNo * (dims[1]+1));
        for(x[1]=0; x[1]<dims[1]-1; ++x[1], ++n, m+=2) {
          for(x[0]=0; x[0]<dims[0]-1; ++x[0], ++n, ++m) {
            let g = 0,
              idx = n,
              mask = 0;
            for(let k=0; k<2; ++k, idx += dims[0]*(dims[1]-2)) {
              for(let j=0; j<2; ++j, idx += dims[0]-2) {
                for(let i=0; i<2; ++i, ++g, ++idx) {
                  const p = data[idx] - level; // to select a single value: (Math.abs(data[idx]-level)<0.5)?1.0:-1.0;
                  grid[g] = p;
                  mask |= (p < 0) ? (1<<g) : 0;
                }
              }
            }
            if(mask === 0 || mask === 0xff) {
              continue;
            }
            var edgeMask = me.edgeTable[mask];
            var v = [0.0, 0.0, 0.0];
            var eCount = 0;
            for(let i=0; i<12; ++i) {
              if(!(edgeMask & (1<<i))) {
                continue;
              }
              ++eCount;
              var e0 = me.cubeEdges[i<<1]; //Unpack vertices
              var e1 = me.cubeEdges[(i<<1)+1];
              var g0 = grid[e0]; //Unpack grid values
              var g1 = grid[e1];
              var t = g0 - g1; //Compute point of intersection
              if(Math.abs(t) > 1e-6) {
                t = g0 / t;
              } else {
                continue;
              }
              for(var j=0, k=1; j<3; ++j, k<<=1) {
                var a = e0 & k;
                var b = e1 & k;
                if(a !== b) {
                  v[j] += a ? 1.0 - t : t;
                } else {
                  v[j] += a ? 1.0 : 0;
                }
              }
            }
            var s = 1.0 / eCount;
            for(let i=0; i<3; ++i) {
              v[i] = (x[i] + s * v[i])*pixdims[i];
            }
            me.buffer[m] = vertices.length;
            vertices.push(v);
            for(let i=0; i<3; ++i) {
              if(!(edgeMask & (1<<i)) ) {
                continue;
              }
              var iu = (i+1)%3;
              var iv = (i+2)%3;
              if(x[iu] === 0 || x[iv] === 0) {
                continue;
              }
              var du = R[iu];
              var dv = R[iv];
              if(mask & 1) {
                faces.push([me.buffer[m], me.buffer[m-du-dv], me.buffer[m-du]]);
                faces.push([me.buffer[m], me.buffer[m-dv], me.buffer[m-du-dv]]);
              } else {
                faces.push([me.buffer[m], me.buffer[m-du-dv], me.buffer[m-dv]]);
                faces.push([me.buffer[m], me.buffer[m-du], me.buffer[m-du-dv]]);
              }
            }
          }
        }
      }

      return {vertices, faces};
    }
  };

  return me;
}
