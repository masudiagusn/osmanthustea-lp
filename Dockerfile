FROM nginx:alpine

# Konfigurasi ringan: gzip + cache aset, sisanya file statis.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

EXPOSE 80
