FROM php:8.4-cli-alpine

RUN apk add --no-cache postgresql-dev postgresql-client $PHPIZE_DEPS linux-headers \
    && docker-php-ext-install pdo_pgsql pgsql bcmath opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers \
    && rm -rf /tmp/* /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Garante que o PHP enxergue as variáveis de ambiente do container ($_ENV),
# independente de como o processo foi iniciado (artisan serve, queue, tinker).
RUN echo 'variables_order = "EGPCS"' > /usr/local/etc/php/conf.d/vars.ini

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

COPY . .
RUN [ -f .env ] || cp .env.example .env
RUN composer dump-autoload --optimize \
    && php artisan key:generate --force --no-interaction 2>/dev/null || true \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD php -r "exit(@file_get_contents('http://localhost:8080/api/health') ? 0 : 1);"

# Roda o servidor web embutido diretamente (sem intermediário) para que o
# processo herde 100% das variáveis de ambiente do container (DB_HOST, etc).
CMD ["sh", "-c", "php artisan migrate --force && php -S 0.0.0.0:8080 -t public"]
