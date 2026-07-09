#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

function localBin(name){
  const extension = process.platform === 'win32' ? '.cmd' : '';
  return path.join(rootDir, 'node_modules', '.bin', `${name}${extension}`);
}

function fileSizeKb(filePath){
  return (fs.statSync(filePath).size / 1024).toFixed(1);
}

function ensureDist(){
  if(!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
    console.log('OK dist directory created');
  }
}

function runMinifier(label, binName, args, outputFile){
  const binPath = localBin(binName);
  if(!fs.existsSync(binPath)){
    console.warn(`SKIP ${label}: ${binName} is not installed locally. Run npm install first.`);
    return;
  }

  execFileSync(binPath, args, { stdio: 'inherit' });
  console.log(`OK ${label}: ${fileSizeKb(outputFile)} KB`);
}

console.log('Build started');
ensureDist();

const cssFile = path.join(srcDir, 'css', 'main.css');
const minCssFile = path.join(distDir, 'main.min.css');
if(fs.existsSync(cssFile)){
  runMinifier('CSS minified', 'csso', [cssFile, '-o', minCssFile], minCssFile);
}else{
  console.warn('SKIP CSS: src/css/main.css not found.');
}

const jsFile = path.join(srcDir, 'js', 'main.js');
const minJsFile = path.join(distDir, 'main.min.js');
if(fs.existsSync(jsFile)){
  runMinifier('JS minified', 'uglifyjs', [jsFile, '-o', minJsFile], minJsFile);
}else{
  console.warn('SKIP JS: src/js/main.js not found.');
}

console.log('Build finished');
