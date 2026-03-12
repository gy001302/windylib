var v=Object.defineProperty;var g=(s,e,t)=>e in s?v(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var n=(s,e,t)=>g(s,typeof e!="symbol"?e+"":e,t);import{l as y,w as S,b as _,n as b}from"./webgl-adapter-CKsAPM5r.js";import{B as f,M as x}from"./FullscreenPostProcessingPass-6T_a1E8b.js";function C(s={}){return Object.fromEntries(Object.entries(s).map(([e,t])=>t&&typeof t=="object"&&"value"in t?[e,t.value]:[e,t]))}class c{constructor(e={}){this.type="custom",this.renderingMode="2d",this.map=null,this.gl=null,this.device=null,this.devicePromise=null,this.destroyed=!1,this.props={...C(this.constructor.defaultProps),...e},this.id=this.props.id}setProps(e={}){const t=this.props;return this.props={...this.props,...e},this.id=this.props.id,this.onPropsChange({props:this.props,oldProps:t,nextProps:e}),this.requestRender(),this}async onAdd(e,t){this.map=e,this.gl=t,this.devicePromise=y.attachDevice(t,{adapters:[S],createCanvasContext:{canvas:t.canvas,autoResize:!1}}).then(r=>this.destroyed?(r.destroy(),null):(this.device=r,this.onDeviceReady(r),this.requestRender(),r)).catch(r=>{throw this.onDeviceError(r),r})}onRemove(e,t){var r;this.destroyed=!0,this.onBeforeRemove({map:e,gl:t}),(r=this.device)==null||r.destroy(),this.device=null,this.map=null,this.gl=null,this.devicePromise=null}requestRender(){var e,t;(t=(e=this.map)==null?void 0:e.triggerRepaint)==null||t.call(e)}onPropsChange(){}onDeviceReady(){}onDeviceError(){}onBeforeRemove(){}}n(c,"componentName","BaseLayer"),n(c,"defaultProps",{});const m=`void main() {
  vec4 position = vec4(a_pos.xy, 0.0, 1.0);
  vec4 projected = u_projection_matrix * position;
  vec4 fallback = u_projection_fallback_matrix * position;
  gl_Position = mix(fallback, projected, clamp(u_projection_transition, 0.0, 1.0));
}
`,p=`precision highp float;

void main() {
  fragColor = u_color;
}
`,d={id:"map-triangle-layer",vertices:{type:"object",compare:!0,value:[[118.3,31.7,0],[119.4,32.2,0],[118.6,32.8,0]]},color:{type:"color",value:[255,120,64,220]},subdivisionSteps:{type:"number",value:24,compare:!0},vertexShader:{type:"string",value:null,compare:!0},fragmentShader:{type:"string",value:null,compare:!0},onShaderStateChange:{type:"function",value:null,compare:!1},projectPosition:{type:"function",value:null,compare:!1}};function P(s,e,t=null){const r=_(s,e),i=new Float32Array(r.length*2);return r.forEach((a,u)=>{const o=typeof t=="function"?t(a):{x:Number(a[0]??0),y:Number(a[1]??0)},h=u*2;i[h]=Number((o==null?void 0:o.x)??(o==null?void 0:o[0])??0),i[h+1]=Number((o==null?void 0:o.y)??(o==null?void 0:o[1])??0)}),{positions:i,vertexCount:r.length}}function R(s,e){return`#version 300 es
${s.vertexShaderPrelude}
${s.define}

in vec2 a_pos;

${e}`}function k(s){return`#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

${s}`}const M={...d,vertexShader:{...d.vertexShader,value:m},fragmentShader:{...d.fragmentShader,value:p}};class l extends c{constructor(e={}){super(e),this.models=new Map,this.positionsBuffer=null,this.vertexCount=0,this.positions=new Float32Array(0),this.shaderState={ok:!0,stage:"init",message:""},this._refreshMesh()}onPropsChange({props:e,oldProps:t,nextProps:r}){const i=(r.vertices!==void 0||r.subdivisionSteps!==void 0)&&(e.vertices!==t.vertices||e.subdivisionSteps!==t.subdivisionSteps),a=(r.vertexShader!==void 0||r.fragmentShader!==void 0)&&(e.vertexShader!==t.vertexShader||e.fragmentShader!==t.fragmentShader);i&&(this._refreshMesh(),this._syncGeometry()),a&&this._destroyModels(),this.onLayerPropsChange({props:e,oldProps:t,nextProps:r,geometryChanged:i,shaderChanged:a})}render(e,t){!this.device||!(t!=null&&t.shaderData)||!(t!=null&&t.defaultProjectionData)||this.renderLayer(e,{shaderDescription:t.shaderData,projectionData:t.defaultProjectionData,size:this.getRenderSize(e)})}onDeviceReady(){this._syncGeometry(),this._onDeviceReady()}onDeviceError(e){this._emitShaderState({ok:!1,stage:"compile",message:e.message})}onBeforeRemove(){var e;this._onBeforeRemove(),this._destroyModels(),(e=this.positionsBuffer)==null||e.destroy(),this.positionsBuffer=null}renderLayer(e,t){const r=this.device.beginRenderPass({id:`${this.id}-screen-pass`,clearColor:!1,clearDepth:!1,clearStencil:!1});try{this.drawToRenderPass({renderPass:r,...t,color:this.props.color})}finally{r.end()}}getRenderSize(e){return{width:Math.max(1,Math.floor(e.drawingBufferWidth||1)),height:Math.max(1,Math.floor(e.drawingBufferHeight||1))}}drawToRenderPass({renderPass:e,shaderDescription:t,projectionData:r,color:i}){const a=this._getModel(t);if(!a)return null;a.setVertexCount(this.vertexCount),a.pipeline.uniforms={...a.pipeline.uniforms,u_projection_fallback_matrix:r.fallbackMatrix,u_projection_matrix:r.mainMatrix,u_projection_tile_mercator_coords:r.tileMercatorCoords,u_projection_clipping_plane:r.clippingPlane,u_projection_transition:r.projectionTransition,u_color:b(i)},this.device.gl.enable(this.device.gl.BLEND),this.device.gl.blendFunc(this.device.gl.SRC_ALPHA,this.device.gl.ONE_MINUS_SRC_ALPHA);try{a.draw(e),this._emitShaderState({ok:!0,stage:"draw",message:"draw ok"})}catch(u){throw this._emitShaderState({ok:!1,stage:"draw",message:u.message}),u}finally{this.device.gl.disable(this.device.gl.BLEND)}return a}_onDeviceReady(){}_onBeforeRemove(){}onLayerPropsChange(){}_refreshMesh(){const e=P(this.props.vertices,this.props.subdivisionSteps,this.props.projectPosition);this.positions=e.positions,this.vertexCount=e.vertexCount}_syncGeometry(){this.device&&(this.positionsBuffer?this.positionsBuffer.write(this.positions):this.positionsBuffer=this.device.createBuffer({id:`${this.id}-positions`,usage:f.VERTEX|f.COPY_DST,data:this.positions}),Array.from(this.models.values()).forEach(e=>{e.setAttributes({a_pos:this.positionsBuffer}),e.setVertexCount(this.vertexCount)}))}_getModel(e){const t=e.variantName||"default";if(this.models.has(t))return this.models.get(t);if(!this.device||!this.positionsBuffer)return null;try{const r=new x(this.device,{id:`${this.id}-${t}`,vs:R(e,this.props.vertexShader),fs:k(this.props.fragmentShader),topology:"triangle-list",isInstanced:!1,vertexCount:this.vertexCount,bufferLayout:[{name:"a_pos",format:"float32x2"}],attributes:{a_pos:this.positionsBuffer}});return this.models.set(t,r),this._emitShaderState({ok:!0,stage:"compile",message:"compile ok"}),r}catch(r){return this._emitShaderState({ok:!1,stage:"compile",message:r.message}),null}}_destroyModels(){Array.from(this.models.values()).forEach(e=>e.destroy()),this.models.clear()}_emitShaderState(e){var t,r;this.shaderState={ok:!0,stage:"unknown",message:"",...e},(r=(t=this.props).onShaderStateChange)==null||r.call(t,{id:this.id,...this.shaderState})}}n(l,"layerName","MapTriangleLayer"),n(l,"defaultProps",M),n(l,"defaultVertexShader",m),n(l,"defaultFragmentShader",p);l.__docgenInfo={description:"",methods:[{name:"onPropsChange",docblock:null,modifiers:[],params:[{name:"{ props, oldProps, nextProps }",optional:!1,type:null}],returns:null},{name:"onDeviceReady",docblock:null,modifiers:[],params:[],returns:null},{name:"onDeviceError",docblock:null,modifiers:[],params:[{name:"error",optional:!1,type:null}],returns:null},{name:"onBeforeRemove",docblock:null,modifiers:[],params:[],returns:null},{name:"renderLayer",docblock:null,modifiers:[],params:[{name:"gl",optional:!1,type:null},{name:"renderContext",optional:!1,type:null}],returns:null},{name:"getRenderSize",docblock:null,modifiers:[],params:[{name:"gl",optional:!1,type:null}],returns:null},{name:"drawToRenderPass",docblock:null,modifiers:[],params:[{name:"{ renderPass, shaderDescription, projectionData, color }",optional:!1,type:null}],returns:null},{name:"_onDeviceReady",docblock:null,modifiers:[],params:[],returns:null},{name:"_onBeforeRemove",docblock:null,modifiers:[],params:[],returns:null},{name:"onLayerPropsChange",docblock:null,modifiers:[],params:[],returns:null},{name:"_refreshMesh",docblock:null,modifiers:[],params:[],returns:null},{name:"_syncGeometry",docblock:null,modifiers:[],params:[],returns:null},{name:"_getModel",docblock:null,modifiers:[],params:[{name:"shaderDescription",optional:!1,type:null}],returns:null},{name:"_destroyModels",docblock:null,modifiers:[],params:[],returns:null},{name:"_emitShaderState",docblock:null,modifiers:[],params:[{name:"partialState",optional:!1,type:null}],returns:null}],displayName:"MapTriangleLayer",props:{id:{defaultValue:{value:"'map-triangle-layer'",computed:!1},required:!1},vertices:{defaultValue:{value:`{
  type: 'object',
  compare: true,
  value: [
    [118.3, 31.7, 0],
    [119.4, 32.2, 0],
    [118.6, 32.8, 0],
  ],
}`,computed:!1},required:!1},color:{defaultValue:{value:`{
  type: 'color',
  value: [255, 120, 64, 220],
}`,computed:!1},required:!1},subdivisionSteps:{defaultValue:{value:`{
  type: 'number',
  value: 24,
  compare: true,
}`,computed:!1},required:!1},vertexShader:{defaultValue:{value:`{
  ...baseDefaultProps.vertexShader,
  value: defaultVertexShader,
}`,computed:!1},required:!1},fragmentShader:{defaultValue:{value:`{
  ...baseDefaultProps.fragmentShader,
  value: defaultFragmentShader,
}`,computed:!1},required:!1},onShaderStateChange:{defaultValue:{value:`{
  type: 'function',
  value: null,
  compare: false,
}`,computed:!1},required:!1},projectPosition:{defaultValue:{value:`{
  type: 'function',
  value: null,
  compare: false,
}`,computed:!1},required:!1}}};export{l as M};
