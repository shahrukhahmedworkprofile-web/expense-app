# Start from the official PHP 8.3 image that includes PHP-FPM
# (PHP-FPM is the process that actually runs PHP code for Nginx)
FROM php:8.3-fpm

# Install system tools and libraries that the PHP extensions below need
# git/unzip: used by Composer to download packages
# libzip-dev, libonig-dev, libpng-dev, libxml2-dev: libraries required to compile the extensions
RUN apt-get update && apt-get install -y git unzip libzip-dev libonig-dev libpng-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install the PHP extensions Laravel needs
# pdo_mysql: lets PHP talk to MySQL
# mbstring, bcmath, zip, exif, pcntl: required or commonly used by Laravel
RUN docker-php-ext-install pdo_mysql mbstring bcmath zip exif pcntl

# Copy the Composer binary from the official Composer image into this image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set the working folder inside the container
# Your Laravel code will be mounted here
WORKDIR /var/www/html