import { name } from "../package.json";
import { PluginArgs, YalPluginsConfig } from "@yal-app/types";
import HomeAssistant from "./ha";

const pluginPath = `${yal.config.pluginsPath}/${name}`;
const configPath = `${pluginPath}/config.json`;

export const config: YalPluginsConfig = {
	keywords: ["ha", "homeassistant"],
	filter: true,
	isApp: true,
	priority: 10,
};

type Action = "turn_off" | "turn_on" | "toggle";

type Set = {
	title: string;
	icon?: string;
	entities: {
		entity: string;
		type: Action;
	}[];
};

interface HaConfig {
	token: string; // home assistant access token
	entities: string[]; // entity id array
	sets: Set[]; // entity id array
}

class HaPlugin {
	config: HaConfig = {
		token: "",
		// prettier-ignore
		entities: [
			"switch.lamp",
			"switch.lamp_2",
			"switch.speakers",
			"switch.pc"
		],
		sets: [
			{
				icon: "command",
				title: "Toggle lamp",
				entities: [
					{
						entity: "switch.lamp",
						type: "toggle",
					},
				],
			},
			{
				title: "Turn everything off",
				entities: [
					{
						entity: "switch.lamp",
						type: "turn_off",
					},
					{
						entity: "switch.lamp_2",
						type: "turn_off",
					},
					{
						entity: "switch.speakers",
						type: "turn_off",
					},
					{
						entity: "switch.pc",
						type: "turn_off",
					},
				],
			},
			{
				title: "Turn things for the PC on.",
				entities: [
					{
						entity: "switch.speakers",
						type: "turn_on",
					},
					{
						entity: "switch.pc",
						type: "turn_on",
					},
				],
			},
		],
	};

	constructor() {
		this.init();
	}

	async init() {
		if (!(await yal.fs.exists(configPath))) {
			this.writeConfig();
		}
		await this.loadConfig();
	}

	async writeConfig() {
		await yal.fs.writeFile(configPath, JSON.stringify(this.config, null, "\t"));
	}

	async loadConfig() {
		const configFile = await yal.fs.readTextFile(configPath);
		this.config = JSON.parse(configFile) as HaConfig;
	}

	async update(args: PluginArgs) {
		const appMode = !!args.appNode;

		if (appMode) {
			const { appNode } = args as { appNode: HTMLElement };
			console.log("this", this);

			appNode.innerHTML = `
				<pre>
					${JSON.stringify(this.config, null, "\t")}
				</pre>
			`;
		} else {
			const setsStates = this.config.sets.map((set) => ({
				name: set.title,
				icon: set.icon || "command",
				metadata: {
					set,
				},
			}));

			args.setState({
				heading: "Home Assistant",
				action: async (result) => {
					const set = result.item.metadata?.set;
					if (set) {
						HomeAssistant.setToken(this.config.token);
						for (let entity of set.entities) {
							switch (entity.type) {
								case "turn_off":
									await HomeAssistant.query("/services/switch/turn_off", entity.entity);
									break;
								case "turn_on":
									await HomeAssistant.query("/services/switch/turn_on", entity.entity);
									break;
								case "toggle":
									await HomeAssistant.query("/services/switch/toggle", entity.entity);
									break;
							}
						}
					}
				},
				state: [...setsStates],
			});
		}
	}
}

const plugin = new HaPlugin();

export default plugin.update.bind(plugin);
