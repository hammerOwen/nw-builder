var f=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var P=Object.getOwnPropertyNames;var S=Object.prototype.hasOwnProperty;var c=(t,r)=>{for(var o in r)f(t,o,{get:r[o],enumerable:!0})},u=(t,r,o,l)=>{if(r&&typeof r=="object"||typeof r=="function")for(let a of P(r))!S.call(t,a)&&a!==o&&f(t,a,{get:()=>r[a],enumerable:!(l=_(r,a))||l.enumerable});return t};var x=t=>u(f({},"__esModule",{value:!0}),t);var N={};c(N,{Platform:()=>m,detectCurrentPlatform:()=>n});module.exports=x(N);var m=(e=>(e.NIX_32="linux32",e.NIX_64="linux64",e.OSX_32="osx32",e.OSX_64="osx64",e.WIN_32="win32",e.WIN_64="win64",e))(m||{});var I=t=>{switch(t.platform){case"darwin":return t.arch==="x64"?"osx64":"osx32";case"win32":return t.arch==="x64"||t.env.PROCESSOR_ARCHITEW6432?"win64":"win32";case"linux":return t.arch==="x64"?"linux64":"linux32";default:return}},n=I;0&&(module.exports={Platform,detectCurrentPlatform});