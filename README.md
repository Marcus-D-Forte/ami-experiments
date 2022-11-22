# ami-experiments
Repositório dedicado a experimentos com ami.js (https://github.com/FNNDSC/ami)

Task trello: https://trello.com/c/Yf3eCmVB/11-2-teste-com-a-api-ami-medical-image-toolkit


## Instalacao
`yarn install` (npm não funciona!)

Se não tiver yarn, pode instalar globalmente `npm install -g yarn`

## Execucao
`yarn run dev`

## Docker
build:
`docker build -t ami-experiment .`

run:
`docker run -p 5173:5173 -it ami-experiment`


## Summary Report

- Códigos exemplos defeituosos (https://codesandbox.io/s/github/FNNDSC/ami/tree/master/lessons/01)
- Suporte para Typescript OK
- Arquivos `dcm` carregados com sucesso
