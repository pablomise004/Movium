FROM phpmyadmin

# Extensiones necesarias para este backend
RUN docker-php-ext-install pdo pdo_mysql

# Modulos Apache utiles para .htaccess (rewrite/headers)
RUN a2enmod rewrite headers

# Permitir .htaccess en /var/www/html
RUN sed -ri 's#AllowOverride None#AllowOverride All#g' /etc/apache2/apache2.conf

CMD ["apache2-foreground"]
