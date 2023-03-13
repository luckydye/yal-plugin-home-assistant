export default class HomeAssistant {
	static token = "";

	static setToken(token: string) {
		this.token = token;
	}

	static query(endpoint: string, entity_id: string) {
		const args = [
			"https://home.luckydye.de/api" + endpoint,
			"-X",
			"POST",
			"-H",
			`Authorization: Bearer ${this.token}`,
			"-H",
			"Content-Type: application/json",
			"-d",
			`'${JSON.stringify({
				entity_id: entity_id,
			})}'`,
		];

		return yal.shell
			.run({
				binary: "curl",
				args,
			})
			.then((output) => {
				console.log(args.join(" "));
				console.log(output);
				return output;
			});
	}
}
