# Port 80 only use for LetsEncrypt 
<VirtualHost *:80>

	Alias /.well-known/acme-challenge/ /var/www/letsencrypt/.well-known/acme-challenge/
	<Directory "/var/www/letsencrypt/.well-known/acme-challenge/">

       Options None

        AllowOverride None

        ForceType text/plain

        RedirectMatch 404 "^(?!/\.well-known/acme-challenge/[\w-]{43}$)"

	</Directory>

	RewriteEngine On

	RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge [NC]

	RewriteCond %{HTTPS} on

	RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

</VirtualHost>

#<VirtualHost *:80>

        # Configuration de l'addresse
#        ServerAdmin     admin@pikouri.fr
#        ServerName      rasp.pikouri.fr
#        DocumentRoot    /usr/share/phpmyadmin/

        # Redirection vers HTTPS
#        RewriteEngine   on
#        RewriteCond     %{HTTPS} !=on
#        RewriteRule     ^(.*)$ https://%{SERVER_NAME}$1 [L,R=301]

#</VirtualHost>

<VirtualHost *:443>
	
	# Activation du SSL
	SSLEngine On

	# Activation de tous les protocoles sécurisés (TLS v1.3 et TLS v1.2) tout en désactivant les protocoles obsolètes (TLS v1.0 et 1.1) et ceux non sécurisés (SSL v2, SSL v3)
	SSLProtocol All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1

	# On active les méthodes de chiffrement, et on désactive les méthodes de chiffrement non sécurisés (par la présence d'un !)
	SSLCipherSuite HIGH:!aNULL:!MD5:!ADH:!RC4:!DH:!RSA


	# Le navigateur devra choisir une méthode de chiffrement en respectant l'ordre indiquée dans SSLCipherSuite
	SSLHonorCipherOrder on

	# Chemin vers le certificat SSL de votre nom de domaine
	SSLCertificateFile "/root/.acme.sh/rasp.pikouri.fr/fullchain.cer"

	# Chemin vers la clée privée du certificat SSL de votre nom de domaine
	SSLCertificateKeyFile "/root/.acme.sh/rasp.pikouri.fr/rasp.pikouri.fr.key"


	# The ServerName directive sets the request scheme, hostname and port that
	# the server uses to identify itself. This is used when creating
	# redirection URLs. In the context of virtual hosts, the ServerName
	# specifies what hostname must appear in the request's Host: header to
	# match this virtual host. For the default virtual host (this file) this
	# value is not decisive as it is used as a last resort host regardless.
	# However, you must set it for any further virtual host explicitly.
	ServerName rasp.pikouri.fr

	ServerAdmin webmaster@localhost
	DocumentRoot /var/www/html

	# Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
	# error, crit, alert, emerg.
	# It is also possible to configure the loglevel for particular
	# modules, e.g.
	#LogLevel info ssl:warn

	ErrorLog ${APACHE_LOG_DIR}/error.log
	CustomLog ${APACHE_LOG_DIR}/access.log combined

	# For most configuration files from conf-available/, which are
	# enabled or disabled at a global level, it is possible to
	# include a line for only one particular virtual host. For example the
	# following line enables the CGI configuration for this host only
	# after it has been globally disabled with "a2disconf".
	#Include conf-available/serve-cgi-bin.conf

	ProxyRequests           Off

        ProxyPreserveHost       On

        <Proxy *>

        Order deny,allow

        Allow from all

        </Proxy>

	ProxyPass /phpmyadmin !

        ProxyPass /phpmyadmin https://127.0.0.1:80/phpmyadmin

        ProxyPassReverse /phpmyadmin https://127.0.0.1:80/phpmyadmin

	# NodeJS

        ProxyPass /  http://127.0.0.1:3000/

        ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>

# vim: syntax=apache ts=4 sw=4 sts=4 sr noet
