# Usa a imagem do Node
FROM node:20

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (otimiza o cache do Docker)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta, o Vite usa 5173, porém optamos por utilizar 3300.
EXPOSE 3300

# Comando para iniciar o servidor de desenvolvimento
# O --host é necessário para que o Docker consiga mapear a porta para fora do container
CMD ["npm", "run", "dev", "--", "--host", "--port", "3300"]