# 1. Imagem base
FROM node:20

# 2. Diretório de trabalho
WORKDIR /app

# 3. Copia arquivos de dependências
COPY package*.json ./

# 4. Instala dependências (incluindo as de compilação para SQLite se necessário)
RUN npm install --build-from-source

# 5. Copia todo o código da pasta backend para dentro de /app
COPY . .

# 6. Expõe a porta 3000
EXPOSE 3000

# 7. Comando para rodar a aplicação
# Ajuste o caminho se o seu arquivo principal for, por exemplo, src/api/server.js
CMD ["node", "src/api/server.js"]
