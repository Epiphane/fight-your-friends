CREATE TABLE fight_app (
 team varchar(64) NOT NULL,
 api_token varchar(256) NOT NULL,
 channel varchar(64) NOT NULL,
 PRIMARY KEY (team)
);
CREATE TABLE fight_item (
 item_id integer NOT NULL,
 user_id integer NOT NULL,
 name varchar(128) NOT NULL,
 stats text NOT NULL,
 type varchar(4) NOT NULL,
 deleted boolean NOT NULL DEFAULT '0',
 PRIMARY KEY (item_id)
);
CREATE TABLE fight_prefs (
 channel_id varchar(16) NOT NULL,
 reactions boolean NOT NULL DEFAULT '1',
 api_token varchar(64) DEFAULT NULL,
 PRIMARY KEY (channel_id)
);
CREATE TABLE fight_reaction (
 image_id integer NOT NULL,
 type varchar(16) NOT NULL,
 image_url varchar(128) NOT NULL,
 user_id integer NOT NULL,
 PRIMARY KEY (image_id)
);
CREATE TABLE fight_session (
 team_id varchar(16) NOT NULL,
 user_id integer NOT NULL,
 token varchar(32) NOT NULL,
 expires timestamp NOT NULL,
 PRIMARY KEY (token)
);
CREATE TABLE fight_user (
 user_id integer NOT NULL,
 email varchar(128) DEFAULT NULL UNIQUE,
 password varchar(128) NOT NULL,
 slack_name varchar(16) NOT NULL,
 team_id varchar(16) NOT NULL,
 AI boolean NOT NULL DEFAULT '0',
 name varchar(100) NOT NULL,
 level integer NOT NULL DEFAULT '1',
 experience integer NOT NULL DEFAULT '0',
 weapon integer DEFAULT NULL,
 armor integer DEFAULT NULL,
 gold integer NOT NULL DEFAULT '0',
 PRIMARY KEY (user_id)
);