# @author DiZed Team
# @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)

env-prepare:
	cp -vn .env.sample .env

config-prepare:
	cp -vn ./config/devices.sample.json ./config/devices.json
	cp -vn ./config/mqtt.sample.json ./config/mqtt.json
	cp -vn ./config/users.sample.json ./config/users.json

docker-prepare:
	cp -vn ./volumes/etc/mosquitto/passwd.sample ./volumes/etc/mosquitto/passwd
	cp -vn ./volumes/mosquitto/config/mosquitto.conf.sample ./volumes/mosquitto/config/mosquitto.conf

docker-local-prepare:
	cp -vp ./docker-compose.local.sample.yml ./docker-compose.local.yml

docker-local-stop:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml stop

docker-local-up:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d

docker-local-restart: docker-local-stop docker-local-up