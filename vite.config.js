import { defineConfig } from 'vite';
export default defineConfig({build:{rollupOptions:{input:{main:'index.html',design:'design.html'}}},server:{host:'0.0.0.0',port:5009,strictPort:true,allowedHosts:['hmsharbor']},preview:{host:'0.0.0.0',port:5009,strictPort:true,allowedHosts:['hmsharbor']}});
