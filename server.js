import express from 'express'
import fs from 'fs'
import fetch from 'node-fetch'

import { publicIp, publicIpv4, publicIpv6 } from 'public-ip';
const app = express();
const port = 80;
const filedir = process.cwd();
const WRITE_OPTIONS = {
	encoding: 'utf8',
	mode: 0o660
};

(function configureMiddleware() {
	app.use((req, res, next) => {
		req.headers['content-type'] = req.headers['content-type'] || 'text/plain';
		next()
	});
	app.use(express.raw({
		type: `*/*`,
		limit: `3MB`
	}));
})();

(function configurePaths() {

	app.get(`/isalive`, (req, res) => {
		console.log('true')
		res.status(200).send(`true`)
	});

	app.use(`/files`, express.static(filedir));

	app.put(`/files/:fileName`, (req, res) => {
		try {
			const fileName = req.params.fileName;
			console.log(`Writing file ${fileName}, size ${req.body.length}`);
			fs.writeFile(fileName, req.body, WRITE_OPTIONS, err => {
				if (err) {
					res.status(500).send(err.message);
				} else {
					res.status(200).send();
				}
			})
		} catch (e) {
			res.status(500).send(`${e}`);
		}
	});

	app.get(`/transfer/:fileName`, async (req, res) => {
		try {
			const fileName = req.params.fileName;
			console.log(`Transferring ${fileName} from Dropbox...`);
			const dropbox = await fetch(`https://content.dropboxapi.com/2/files/download`, {
				headers: {
					"Dropbox-API-Arg": `{"path":"/MultiplayerGames/${fileName}"}`,
					"Content-Type": `text/plain`,
					Authorization: `Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb`
				}
			});

			console.log(`Success, writing file ${fileName}`);
			await dropbox.body.pipe(fs.createWriteStream(fileName, WRITE_OPTIONS));

			res.status(200).send();
		} catch (e) {
			res.status(500).send(`${e}`);
		}
	})
})();

async function yes() {
	console.log(await publicIp());
};

yes();

app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});
