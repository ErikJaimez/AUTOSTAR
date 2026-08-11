import{s as H}from"./index-kiLIYHlw.js";import{s as K}from"./index-HpldA5jx.js";import{s as V}from"./index-BpY19cii.js";import{B as w,at as W,P as y,Q as $,s as M,o as u,c as h,a as s,m as c,i as B,Z as z,ab as G,G as D,h as x,w as v,J as k,L as T,K as C,T as N,t as O,b as n,r as j,e as J,aT as Z,H as Q}from"./index-D0R20c2G.js";import{s as _}from"./index-CncDixI6.js";import{s as U}from"./index-Bqv2klG5.js";import{a as S}from"./index-BL33L0P5.js";import{s as ee}from"./index-DXDLr8eb.js";var te=({dt:e})=>`
.p-scrollpanel-content-container {
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    float: left;
}

.p-scrollpanel-content {
    height: calc(100% + calc(2 * ${e("scrollpanel.bar.size")}));
    width: calc(100% + calc(2 * ${e("scrollpanel.bar.size")}));
    padding-inline: 0 calc(2 * ${e("scrollpanel.bar.size")});
    padding-block: 0 calc(2 * ${e("scrollpanel.bar.size")});
    position: relative;
    overflow: auto;
    box-sizing: border-box;
    scrollbar-width: none;
}

.p-scrollpanel-content::-webkit-scrollbar {
    display: none;
}

.p-scrollpanel-bar {
    position: relative;
    border-radius: ${e("scrollpanel.bar.border.radius")};
    z-index: 2;
    cursor: pointer;
    opacity: 0;
    outline-color: transparent;
    background: ${e("scrollpanel.bar.background")};
    border: 0 none;
    transition: outline-color ${e("scrollpanel.transition.duration")}, opacity ${e("scrollpanel.transition.duration")};
}

.p-scrollpanel-bar:focus-visible {
    box-shadow: ${e("scrollpanel.bar.focus.ring.shadow")};
    outline: ${e("scrollpanel.barfocus.ring.width")} ${e("scrollpanel.bar.focus.ring.style")} ${e("scrollpanel.bar.focus.ring.color")};
    outline-offset: ${e("scrollpanel.barfocus.ring.offset")};
}

.p-scrollpanel-bar-y {
    width: ${e("scrollpanel.bar.size")};
    inset-block-start: 0;
}

.p-scrollpanel-bar-x {
    height: ${e("scrollpanel.bar.size")};
    inset-block-end: 0;
}

.p-scrollpanel-hidden {
    visibility: hidden;
}

.p-scrollpanel:hover .p-scrollpanel-bar,
.p-scrollpanel:active .p-scrollpanel-bar {
    opacity: 1;
}

.p-scrollpanel-grabbed {
    user-select: none;
}
`,ne={root:"p-scrollpanel p-component",contentContainer:"p-scrollpanel-content-container",content:"p-scrollpanel-content",barX:"p-scrollpanel-bar p-scrollpanel-bar-x",barY:"p-scrollpanel-bar p-scrollpanel-bar-y"},re=w.extend({name:"scrollpanel",style:te,classes:ne}),se={name:"BaseScrollPanel",extends:M,props:{step:{type:Number,default:5}},style:re,provide:function(){return{$pcScrollPanel:this,$parentInstance:this}}},P={name:"ScrollPanel",extends:se,inheritAttrs:!1,initialized:!1,documentResizeListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,frame:null,scrollXRatio:null,scrollYRatio:null,isXBarClicked:!1,isYBarClicked:!1,lastPageX:null,lastPageY:null,timer:null,outsideClickListener:null,data:function(){return{orientation:"vertical",lastScrollTop:0,lastScrollLeft:0}},mounted:function(){this.$el.offsetParent&&this.initialize()},updated:function(){!this.initialized&&this.$el.offsetParent&&this.initialize()},beforeUnmount:function(){this.unbindDocumentResizeListener(),this.frame&&window.cancelAnimationFrame(this.frame)},methods:{initialize:function(){this.moveBar(),this.bindDocumentResizeListener(),this.calculateContainerHeight()},calculateContainerHeight:function(){var t=getComputedStyle(this.$el),i=getComputedStyle(this.$refs.xBar),o=W(this.$el)-parseInt(i.height,10);t["max-height"]!=="none"&&o===0&&(this.$refs.content.offsetHeight+parseInt(i.height,10)>parseInt(t["max-height"],10)?this.$el.style.height=t["max-height"]:this.$el.style.height=this.$refs.content.offsetHeight+parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)+parseFloat(t.borderTopWidth)+parseFloat(t.borderBottomWidth)+"px")},moveBar:function(){var t=this;if(this.$refs.content){var i=this.$refs.content.scrollWidth,o=this.$refs.content.clientWidth,d=(this.$el.clientHeight-this.$refs.xBar.clientHeight)*-1;this.scrollXRatio=o/i;var a=this.$refs.content.scrollHeight,r=this.$refs.content.clientHeight,g=(this.$el.clientWidth-this.$refs.yBar.clientWidth)*-1;this.scrollYRatio=r/a,this.frame=this.requestAnimationFrame(function(){t.$refs.xBar&&(t.scrollXRatio>=1?(t.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","true"),!t.isUnstyled&&y(t.$refs.xBar,"p-scrollpanel-hidden")):(t.$refs.xBar.setAttribute("data-p-scrollpanel-hidden","false"),!t.isUnstyled&&$(t.$refs.xBar,"p-scrollpanel-hidden"),t.$refs.xBar.style.cssText="width:"+Math.max(t.scrollXRatio*100,10)+"%; inset-inline-start:"+Math.abs(t.$refs.content.scrollLeft)/i*100+"%;bottom:"+d+"px;")),t.$refs.yBar&&(t.scrollYRatio>=1?(t.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","true"),!t.isUnstyled&&y(t.$refs.yBar,"p-scrollpanel-hidden")):(t.$refs.yBar.setAttribute("data-p-scrollpanel-hidden","false"),!t.isUnstyled&&$(t.$refs.yBar,"p-scrollpanel-hidden"),t.$refs.yBar.style.cssText="height:"+Math.max(t.scrollYRatio*100,10)+"%; top: calc("+t.$refs.content.scrollTop/a*100+"% - "+t.$refs.xBar.clientHeight+"px); inset-inline-end:"+g+"px;"))})}},onYBarMouseDown:function(t){this.isYBarClicked=!0,this.$refs.yBar.focus(),this.lastPageY=t.pageY,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&y(this.$refs.yBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","true"),!this.isUnstyled&&y(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),t.preventDefault()},onXBarMouseDown:function(t){this.isXBarClicked=!0,this.$refs.xBar.focus(),this.lastPageX=t.pageX,this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&y(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&y(document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),t.preventDefault()},onScroll:function(t){this.lastScrollLeft!==t.target.scrollLeft?(this.lastScrollLeft=t.target.scrollLeft,this.orientation="horizontal"):this.lastScrollTop!==t.target.scrollTop&&(this.lastScrollTop=t.target.scrollTop,this.orientation="vertical"),this.moveBar()},onKeyDown:function(t){if(this.orientation==="vertical")switch(t.code){case"ArrowDown":{this.setTimer("scrollTop",this.step),t.preventDefault();break}case"ArrowUp":{this.setTimer("scrollTop",this.step*-1),t.preventDefault();break}case"ArrowLeft":case"ArrowRight":{t.preventDefault();break}}else if(this.orientation==="horizontal")switch(t.code){case"ArrowRight":{this.setTimer("scrollLeft",this.step),t.preventDefault();break}case"ArrowLeft":{this.setTimer("scrollLeft",this.step*-1),t.preventDefault();break}case"ArrowDown":case"ArrowUp":{t.preventDefault();break}}},onKeyUp:function(){this.clearTimer()},repeat:function(t,i){this.$refs.content[t]+=i,this.moveBar()},setTimer:function(t,i){var o=this;this.clearTimer(),this.timer=setTimeout(function(){o.repeat(t,i)},40)},clearTimer:function(){this.timer&&clearTimeout(this.timer)},onDocumentMouseMove:function(t){this.isXBarClicked?this.onMouseMoveForXBar(t):this.isYBarClicked?this.onMouseMoveForYBar(t):(this.onMouseMoveForXBar(t),this.onMouseMoveForYBar(t))},onMouseMoveForXBar:function(t){var i=this,o=t.pageX-this.lastPageX;this.lastPageX=t.pageX,this.frame=this.requestAnimationFrame(function(){i.$refs.content.scrollLeft+=o/i.scrollXRatio})},onMouseMoveForYBar:function(t){var i=this,o=t.pageY-this.lastPageY;this.lastPageY=t.pageY,this.frame=this.requestAnimationFrame(function(){i.$refs.content.scrollTop+=o/i.scrollYRatio})},onFocus:function(t){this.$refs.xBar.isSameNode(t.target)?this.orientation="horizontal":this.$refs.yBar.isSameNode(t.target)&&(this.orientation="vertical")},onBlur:function(){this.orientation==="horizontal"&&(this.orientation="vertical")},onDocumentMouseUp:function(){this.$refs.yBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&$(this.$refs.yBar,"p-scrollpanel-grabbed"),this.$refs.xBar.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&$(this.$refs.xBar,"p-scrollpanel-grabbed"),document.body.setAttribute("data-p-scrollpanel-grabbed","false"),!this.isUnstyled&&$(document.body,"p-scrollpanel-grabbed"),this.unbindDocumentMouseListeners(),this.isXBarClicked=!1,this.isYBarClicked=!1},requestAnimationFrame:function(t){var i=window.requestAnimationFrame||this.timeoutFrame;return i(t)},refresh:function(){this.moveBar()},scrollTop:function(t){var i=this.$refs.content.scrollHeight-this.$refs.content.clientHeight;t=t>i?i:t>0?t:0,this.$refs.content.scrollTop=t},timeoutFrame:function(t){setTimeout(t,0)},bindDocumentMouseListeners:function(){var t=this;this.documentMouseMoveListener||(this.documentMouseMoveListener=function(i){t.onDocumentMouseMove(i)},document.addEventListener("mousemove",this.documentMouseMoveListener)),this.documentMouseUpListener||(this.documentMouseUpListener=function(i){t.onDocumentMouseUp(i)},document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseListeners:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null),this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},bindDocumentResizeListener:function(){var t=this;this.documentResizeListener||(this.documentResizeListener=function(){t.moveBar()},window.addEventListener("resize",this.documentResizeListener))},unbindDocumentResizeListener:function(){this.documentResizeListener&&(window.removeEventListener("resize",this.documentResizeListener),this.documentResizeListener=null)}},computed:{contentId:function(){return this.$id+"_content"}}},ae=["id"],ie=["aria-controls","aria-valuenow"],oe=["aria-controls","aria-valuenow"];function le(e,t,i,o,d,a){return u(),h("div",c({class:e.cx("root")},e.ptmi("root")),[s("div",c({class:e.cx("contentContainer")},e.ptm("contentContainer")),[s("div",c({ref:"content",id:a.contentId,class:e.cx("content"),onScroll:t[0]||(t[0]=function(){return a.onScroll&&a.onScroll.apply(a,arguments)}),onMouseenter:t[1]||(t[1]=function(){return a.moveBar&&a.moveBar.apply(a,arguments)})},e.ptm("content")),[B(e.$slots,"default")],16,ae)],16),s("div",c({ref:"xBar",class:e.cx("barx"),tabindex:"0",role:"scrollbar","aria-orientation":"horizontal","aria-controls":a.contentId,"aria-valuenow":d.lastScrollLeft,onMousedown:t[2]||(t[2]=function(){return a.onXBarMouseDown&&a.onXBarMouseDown.apply(a,arguments)}),onKeydown:t[3]||(t[3]=function(r){return a.onKeyDown(r)}),onKeyup:t[4]||(t[4]=function(){return a.onKeyUp&&a.onKeyUp.apply(a,arguments)}),onFocus:t[5]||(t[5]=function(){return a.onFocus&&a.onFocus.apply(a,arguments)}),onBlur:t[6]||(t[6]=function(){return a.onBlur&&a.onBlur.apply(a,arguments)})},e.ptm("barx"),{"data-pc-group-section":"bar"}),null,16,ie),s("div",c({ref:"yBar",class:e.cx("bary"),tabindex:"0",role:"scrollbar","aria-orientation":"vertical","aria-controls":a.contentId,"aria-valuenow":d.lastScrollTop,onMousedown:t[7]||(t[7]=function(){return a.onYBarMouseDown&&a.onYBarMouseDown.apply(a,arguments)}),onKeydown:t[8]||(t[8]=function(r){return a.onKeyDown(r)}),onKeyup:t[9]||(t[9]=function(){return a.onKeyUp&&a.onKeyUp.apply(a,arguments)}),onFocus:t[10]||(t[10]=function(){return a.onFocus&&a.onFocus.apply(a,arguments)})},e.ptm("bary"),{"data-pc-group-section":"bar"}),null,16,oe)],16)}P.render=le;var ce=`
.p-scrolltop.p-button {
    position: fixed !important;
    inset-block-end: 20px;
    inset-inline-end: 20px;
}

.p-scrolltop-sticky.p-button {
    position: sticky !important;
    display: flex;
    margin-inline-start: auto;
}

.p-scrolltop-enter-from {
    opacity: 0;
}

.p-scrolltop-enter-active {
    transition: opacity 0.15s;
}

.p-scrolltop.p-scrolltop-leave-to {
    opacity: 0;
}

.p-scrolltop-leave-active {
    transition: opacity 0.15s;
}
`,ue={root:function(t){var i=t.props;return["p-scrolltop",{"p-scrolltop-sticky":i.target!=="window"}]},icon:"p-scrolltop-icon"},de=w.extend({name:"scrolltop",style:ce,classes:ue}),pe={name:"BaseScrollTop",extends:M,props:{target:{type:String,default:"window"},threshold:{type:Number,default:400},icon:{type:String,default:void 0},behavior:{type:String,default:"smooth"},buttonProps:{type:Object,default:function(){return{rounded:!0}}}},style:de,provide:function(){return{$pcScrollTop:this,$parentInstance:this}}},F={name:"ScrollTop",extends:pe,inheritAttrs:!1,scrollListener:null,container:null,data:function(){return{visible:!1}},mounted:function(){this.target==="window"?this.bindDocumentScrollListener():this.target==="parent"&&this.bindParentScrollListener()},beforeUnmount:function(){this.target==="window"?this.unbindDocumentScrollListener():this.target==="parent"&&this.unbindParentScrollListener(),this.container&&(z.clear(this.container),this.overlay=null)},methods:{onClick:function(){var t=this.target==="window"?window:this.$el.parentElement;t.scroll({top:0,behavior:this.behavior})},checkVisibility:function(t){t>this.threshold?this.visible=!0:this.visible=!1},bindParentScrollListener:function(){var t=this;this.scrollListener=function(){t.checkVisibility(t.$el.parentElement.scrollTop)},this.$el.parentElement.addEventListener("scroll",this.scrollListener)},bindDocumentScrollListener:function(){var t=this;this.scrollListener=function(){t.checkVisibility(G())},window.addEventListener("scroll",this.scrollListener)},unbindParentScrollListener:function(){this.scrollListener&&(this.$el.parentElement.removeEventListener("scroll",this.scrollListener),this.scrollListener=null)},unbindDocumentScrollListener:function(){this.scrollListener&&(window.removeEventListener("scroll",this.scrollListener),this.scrollListener=null)},onEnter:function(t){z.set("overlay",t,this.$primevue.config.zIndex.overlay)},onAfterLeave:function(t){z.clear(t)},containerRef:function(t){this.container=t?t.$el:void 0}},computed:{scrollTopAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.scrollTop:void 0}},components:{ChevronUpIcon:_,Button:U}};function me(e,t,i,o,d,a){var r=D("Button");return u(),x(N,c({name:"p-scrolltop",appear:"",onEnter:a.onEnter,onAfterLeave:a.onAfterLeave},e.ptm("transition")),{default:v(function(){return[d.visible?(u(),x(r,c({key:0,ref:a.containerRef,class:e.cx("root"),onClick:a.onClick,"aria-label":a.scrollTopAriaLabel,unstyled:e.unstyled},e.buttonProps,{pt:e.pt}),{icon:v(function(g){return[B(e.$slots,"icon",{class:k(e.cx("icon"))},function(){return[(u(),x(T(e.icon?"span":"ChevronUpIcon"),c({class:[e.cx("icon"),e.icon,g.class]},e.ptm("icon")),null,16,["class"]))]})]}),_:3},16,["class","onClick","aria-label","unstyled","pt"])):C("",!0)]}),_:3},16,["onEnter","onAfterLeave"])}F.render=me;var fe={root:"p-avatar-group p-component"},ve=w.extend({name:"avatargroup",classes:fe}),he={name:"BaseAvatarGroup",extends:M,style:ve,provide:function(){return{$pcAvatarGroup:this,$parentInstance:this}}},E={name:"AvatarGroup",extends:he,inheritAttrs:!1};function be(e,t,i,o,d,a){return u(),h("div",c({class:e.cx("root")},e.ptmi("root")),[B(e.$slots,"default")],16)}E.render=be;var ge=({dt:e})=>`
.p-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${e("avatar.width")};
    height: ${e("avatar.height")};
    font-size: ${e("avatar.font.size")};
    background: ${e("avatar.background")};
    color: ${e("avatar.color")};
    border-radius: ${e("avatar.border.radius")};
}

.p-avatar-image {
    background: transparent;
}

.p-avatar-circle {
    border-radius: 50%;
}

.p-avatar-circle img {
    border-radius: 50%;
}

.p-avatar-icon {
    font-size: ${e("avatar.icon.size")};
    width: ${e("avatar.icon.size")};
    height: ${e("avatar.icon.size")};
}

.p-avatar img {
    width: 100%;
    height: 100%;
}

.p-avatar-lg {
    width: ${e("avatar.lg.width")};
    height: ${e("avatar.lg.width")};
    font-size: ${e("avatar.lg.font.size")};
}

.p-avatar-lg .p-avatar-icon {
    font-size: ${e("avatar.lg.icon.size")};
    width: ${e("avatar.lg.icon.size")};
    height: ${e("avatar.lg.icon.size")};
}

.p-avatar-xl {
    width: ${e("avatar.xl.width")};
    height: ${e("avatar.xl.width")};
    font-size: ${e("avatar.xl.font.size")};
}

.p-avatar-xl .p-avatar-icon {
    font-size: ${e("avatar.xl.icon.size")};
    width: ${e("avatar.xl.icon.size")};
    height: ${e("avatar.xl.icon.size")};
}

.p-avatar-group {
    display: flex;
    align-items: center;
}

.p-avatar-group .p-avatar + .p-avatar {
    margin-inline-start: ${e("avatar.group.offset")};
}

.p-avatar-group .p-avatar {
    border: 2px solid ${e("avatar.group.border.color")};
}

.p-avatar-group .p-avatar-lg + .p-avatar-lg {
    margin-inline-start: ${e("avatar.lg.group.offset")};
}

.p-avatar-group .p-avatar-xl + .p-avatar-xl {
    margin-inline-start: ${e("avatar.xl.group.offset")};
}
`,ye={root:function(t){var i=t.props;return["p-avatar p-component",{"p-avatar-image":i.image!=null,"p-avatar-circle":i.shape==="circle","p-avatar-lg":i.size==="large","p-avatar-xl":i.size==="xlarge"}]},label:"p-avatar-label",icon:"p-avatar-icon"},$e=w.extend({name:"avatar",style:ge,classes:ye}),we={name:"BaseAvatar",extends:M,props:{label:{type:String,default:null},icon:{type:String,default:null},image:{type:String,default:null},size:{type:String,default:"normal"},shape:{type:String,default:"square"},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:$e,provide:function(){return{$pcAvatar:this,$parentInstance:this}}},R={name:"Avatar",extends:we,inheritAttrs:!1,emits:["error"],methods:{onError:function(t){this.$emit("error",t)}}},Be=["aria-labelledby","aria-label"],Le=["src","alt"];function xe(e,t,i,o,d,a){return u(),h("div",c({class:e.cx("root"),"aria-labelledby":e.ariaLabelledby,"aria-label":e.ariaLabel},e.ptmi("root")),[B(e.$slots,"default",{},function(){return[e.label?(u(),h("span",c({key:0,class:e.cx("label")},e.ptm("label")),O(e.label),17)):e.$slots.icon?(u(),x(T(e.$slots.icon),{key:1,class:k(e.cx("icon"))},null,8,["class"])):e.icon?(u(),h("span",c({key:2,class:[e.cx("icon"),e.icon]},e.ptm("icon")),null,16)):e.image?(u(),h("img",c({key:3,src:e.image,alt:e.ariaLabel,onError:t[0]||(t[0]=function(){return a.onError&&a.onError.apply(a,arguments)})},e.ptm("image")),null,16,Le)):C("",!0)]})],16,Be)}R.render=xe;var Me=({dt:e})=>`
.p-overlaybadge {
    position: relative;
}

.p-overlaybadge .p-badge {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    transform: translate(50%, -50%);
    transform-origin: 100% 0;
    margin: 0;
    outline-width: ${e("overlaybadge.outline.width")};
    outline-style: solid;
    outline-color: ${e("overlaybadge.outline.color")};
}

.p-overlaybadge .p-badge:dir(rtl) {
    transform: translate(-50%, -50%);
}
`,ze={root:"p-overlaybadge"},Se=w.extend({name:"overlaybadge",style:Me,classes:ze}),Ae={name:"OverlayBadge",extends:S,style:Se,provide:function(){return{$pcOverlayBadge:this,$parentInstance:this}}},I={name:"OverlayBadge",extends:Ae,inheritAttrs:!1,components:{Badge:S}};function De(e,t,i,o,d,a){var r=D("Badge");return u(),h("div",c({class:e.cx("root")},e.ptmi("root")),[B(e.$slots,"default"),n(r,c(e.$props,{pt:e.ptm("pcBadge")}),null,16,["pt"])],16)}I.render=De;const ke={class:"card"},Te={class:"flex flex-col md:flex-row gap-4"},Ce={class:"md:w-1/2"},Ue={class:"md:w-1/2"},Pe={class:"flex flex-col md:flex-row gap-8"},Fe={class:"md:w-1/2"},Ee={class:"card"},Re={class:"flex gap-2"},Ie={class:"flex gap-6"},Xe={class:"flex gap-2"},Ye={class:"flex items-start gap-2"},qe={class:"card"},He={class:"card"},Ke={class:"md:w-1/2"},Ve={class:"card"},We={class:"flex gap-2"},Ge={class:"flex gap-2"},Ne={class:"flex gap-2"},Oe={class:"card"},je={class:"flex items-center flex-col sm:flex-row"},Je={class:"flex items-center flex-col sm:flex-row"},Ze={class:"flex items-center flex-col sm:flex-row"},Qe={class:"card"},_e={class:"rounded-border border border-surface p-6"},et={class:"flex mb-4"},tt={class:"flex justify-between mt-4"},ut={__name:"MiscDoc",setup(e){const t=j(0);let i=null;function o(){i=setInterval(()=>{let a=t.value+Math.floor(Math.random()*10)+1;a>=100&&(a=100),t.value=a},2e3)}function d(){clearInterval(i),i=null}return J(()=>{o()}),Z(()=>{d()}),(a,r)=>{const g=ee,f=S,L=I,A=U,m=R,X=E,Y=F,q=P,l=V,p=K,b=H;return u(),h(Q,null,[s("div",ke,[r[0]||(r[0]=s("div",{class:"font-semibold text-xl mb-4"},"ProgressBar",-1)),s("div",Te,[s("div",Ce,[n(g,{value:t.value},null,8,["value"])]),s("div",Ue,[n(g,{value:50,showValue:!1})])])]),s("div",Pe,[s("div",Fe,[s("div",Ee,[r[4]||(r[4]=s("div",{class:"font-semibold text-xl mb-4"},"Badge",-1)),s("div",Re,[n(f,{value:2}),n(f,{value:8,severity:"success"}),n(f,{value:4,severity:"info"}),n(f,{value:12,severity:"Warn"}),n(f,{value:3,severity:"danger"})]),r[5]||(r[5]=s("div",{class:"font-semibold my-4"},"Overlay",-1)),s("div",Ie,[n(L,{value:"2"},{default:v(()=>r[1]||(r[1]=[s("i",{class:"pi pi-bell",style:{"font-size":"2rem"}},null,-1)])),_:1}),n(L,{value:"4",severity:"danger"},{default:v(()=>r[2]||(r[2]=[s("i",{class:"pi pi-calendar",style:{"font-size":"2rem"}},null,-1)])),_:1}),n(L,{severity:"danger"},{default:v(()=>r[3]||(r[3]=[s("i",{class:"pi pi-envelope",style:{"font-size":"2rem"}},null,-1)])),_:1})]),r[6]||(r[6]=s("div",{class:"font-semibold my-4"},"Button",-1)),s("div",Xe,[n(A,{label:"Emails",badge:"8",class:"mr-2"}),n(A,{label:"Messages",icon:"pi pi-users",severity:"warn",badge:"8",badgeClass:"p-badge-danger"})]),r[7]||(r[7]=s("div",{class:"font-semibold my-4"},"Sizes",-1)),s("div",Ye,[n(f,{value:2}),n(f,{value:4,size:"large",severity:"warn"}),n(f,{value:6,size:"xlarge",severity:"success"})])]),s("div",qe,[r[8]||(r[8]=s("div",{class:"font-semibold text-xl mb-4"},"Avatar",-1)),r[9]||(r[9]=s("div",{class:"font-semibold mb-4"},"Group",-1)),n(X,null,{default:v(()=>[n(m,{image:"https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png",size:"large",shape:"circle"}),n(m,{image:"https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png",size:"large",shape:"circle"}),n(m,{image:"https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png",size:"large",shape:"circle"}),n(m,{image:"https://primefaces.org/cdn/primevue/images/avatar/ionibowcher.png",size:"large",shape:"circle"}),n(m,{image:"https://primefaces.org/cdn/primevue/images/avatar/xuxuefeng.png",size:"large",shape:"circle"}),n(m,{label:"+2",shape:"circle",size:"large",style:{"background-color":"#9c27b0",color:"#ffffff"}})]),_:1}),r[10]||(r[10]=s("div",{class:"font-semibold my-4"},"Label - Circle",-1)),n(m,{label:"P",class:"mr-2",size:"xlarge",shape:"circle"}),n(m,{label:"V",class:"mr-2",size:"large",style:{"background-color":"#2196F3",color:"#ffffff"},shape:"circle"}),n(m,{label:"U",class:"mr-2",style:{"background-color":"#9c27b0",color:"#ffffff"},shape:"circle"}),r[11]||(r[11]=s("div",{class:"font-semibold my-4"},"Icon - Badge",-1)),n(L,{value:"4",severity:"danger",class:"inline-flex"},{default:v(()=>[n(m,{label:"U",size:"xlarge"})]),_:1})]),s("div",He,[r[13]||(r[13]=s("div",{class:"font-semibold text-xl mb-4"},"ScrollTop",-1)),n(q,{style:{width:"250px",height:"200px"}},{default:v(()=>[r[12]||(r[12]=s("p",null," Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae et leo duis ut diam. Ultricies mi quis hendrerit dolor magna eget est lorem. Amet consectetur adipiscing elit ut. Nam libero justo laoreet sit amet. Pharetra massa massa ultricies mi quis hendrerit dolor magna. Est ultricies integer quis auctor elit sed vulputate. Consequat ac felis donec et. Tellus orci ac auctor augue mauris. Semper feugiat nibh sed pulvinar proin gravida hendrerit lectus a. Tincidunt arcu non sodales neque sodales. Metus aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices. Sodales ut etiam sit amet nisl purus. Cursus sit amet dictum sit amet. Tristique senectus et netus et malesuada fames ac turpis egestas. Et tortor consequat id porta nibh venenatis cras sed. Diam maecenas ultricies mi eget mauris. Eget egestas purus viverra accumsan in nisl nisi. Suscipit adipiscing bibendum est ultricies integer. Mattis aliquam faucibus purus in massa tempor nec. ",-1)),n(Y,{target:"parent",threshold:100,icon:"pi pi-arrow-up"})]),_:1})])]),s("div",Ke,[s("div",Ve,[r[14]||(r[14]=s("div",{class:"font-semibold text-xl mb-4"},"Tag",-1)),r[15]||(r[15]=s("div",{class:"font-semibold mb-4"},"Default",-1)),s("div",We,[n(l,{value:"Primary"}),n(l,{severity:"success",value:"Success"}),n(l,{severity:"info",value:"Info"}),n(l,{severity:"warn",value:"Warn"}),n(l,{severity:"danger",value:"Danger"})]),r[16]||(r[16]=s("div",{class:"font-semibold my-4"},"Pills",-1)),s("div",Ge,[n(l,{value:"Primary",rounded:!0}),n(l,{severity:"success",value:"Success",rounded:!0}),n(l,{severity:"info",value:"Info",rounded:!0}),n(l,{severity:"warn",value:"Warn",rounded:!0}),n(l,{severity:"danger",value:"Danger",rounded:!0})]),r[17]||(r[17]=s("div",{class:"font-semibold my-4"},"Icons",-1)),s("div",Ne,[n(l,{icon:"pi pi-user",value:"Primary"}),n(l,{icon:"pi pi-check",severity:"success",value:"Success"}),n(l,{icon:"pi pi-info-circle",severity:"info",value:"Info"}),n(l,{con:"pi pi-exclamation-triangle",severity:"warn",value:"Warn"}),n(l,{icon:"pi pi-times",severity:"danger",value:"Danger"})])]),s("div",Oe,[r[18]||(r[18]=s("div",{class:"font-semibold text-xl mb-4"},"Chip",-1)),r[19]||(r[19]=s("div",{class:"font-semibold mb-4"},"Basic",-1)),s("div",je,[n(p,{label:"Action",class:"mr-2 mb-2"}),n(p,{label:"Comedy",class:"mr-2 mb-2"}),n(p,{label:"Mystery",class:"mr-2 mb-2"}),n(p,{label:"Thriller",removable:!0,class:"mb-2"})]),r[20]||(r[20]=s("div",{class:"font-semibold my-4"},"Icon",-1)),s("div",Je,[n(p,{label:"Apple",icon:"pi pi-apple",class:"mr-2 mb-2"}),n(p,{label:"Facebook",icon:"pi pi-facebook",class:"mr-2 mb-2"}),n(p,{label:"Google",icon:"pi pi-google",class:"mr-2 mb-2"}),n(p,{label:"Microsoft",icon:"pi pi-microsoft",removable:!0,class:"mb-2"})]),r[21]||(r[21]=s("div",{class:"font-semibold my-4"},"Image",-1)),s("div",Ze,[n(p,{label:"Amy Elsner",image:"https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png",class:"mr-2 mb-2"}),n(p,{label:"Asiya Javayant",image:"https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png",class:"mr-2 mb-2"}),n(p,{label:"Onyama Limba",image:"https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png",class:"mr-2 mb-2"})])]),s("div",Qe,[r[22]||(r[22]=s("div",{class:"font-semibold text-xl mb-4"},"Skeleton",-1)),s("div",_e,[s("div",et,[n(b,{shape:"circle",size:"4rem",class:"mr-2"}),s("div",null,[n(b,{width:"10rem",class:"mb-2"}),n(b,{width:"5rem",class:"mb-2"}),n(b,{height:".5rem"})])]),n(b,{width:"100%",height:"150px"}),s("div",tt,[n(b,{width:"4rem",height:"2rem"}),n(b,{width:"4rem",height:"2rem"})])])])])])],64)}}};export{ut as default};
