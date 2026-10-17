# md-docs addon — system unit template
# Render placeholders before install:
#   sed "s/__SOC_USER__/wez/g; s/__MD_DOCS_ROOT__/\/opt\/md-docs/g" md-docs-system.service.tpl \
#     > /etc/systemd/system/md-docs.service
# (deploy/install.sh does this for you.)
# md-docs.env is optional (token config); the "-" prefix = no failure if absent.

[Unit]
Description=md-docs markdown doc site (docs library for the SOC dashboard)
After=network.target

[Service]
Type=simple
User=__SOC_USER__
Group=__SOC_USER__
WorkingDirectory=__MD_DOCS_ROOT__
ExecStart=/usr/bin/node __MD_DOCS_ROOT__/server.js
EnvironmentFile=-__MD_DOCS_ROOT__/md-docs.env
Restart=on-failure
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target