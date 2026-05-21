FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static maintenance page
COPY error.html /usr/share/nginx/html/error.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
