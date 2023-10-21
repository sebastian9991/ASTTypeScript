export default class Room {
	public fullname: string | undefined;
	public shortname: string | undefined;
	public number: string | undefined;
	public name: string | undefined;
	public address: string | undefined;
	public lat: number | undefined;
	public lon: number | undefined;
	public seats: number | undefined;
	public type: string | undefined;
	public furniture: string | undefined;
	public href: string | undefined;

	constructor(
		fn: string | undefined,
		sn: string | undefined,
		num: string | undefined,
		name: string | undefined,
		address: string | undefined,
		lat: number | undefined,
		lon: number | undefined,
		seats: number | undefined,
		type: string | undefined,
		furniture: string | undefined,
		href: string | undefined
	) {
		this.fullname = fn;
		this.shortname = sn;
		this.number = num;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}
}
