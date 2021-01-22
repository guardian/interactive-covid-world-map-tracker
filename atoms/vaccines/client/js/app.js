import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'assets/ne_10m_admin_0_countries.json'
import { numberWithCommas } from 'shared/js/util'

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.vac-map-container').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height =  width * 2.5 / 5;

let projection = d3.geoEckert4();

let path = d3.geoPath()
.projection(projection);

let extent = {
        type: "LineString",
        /*coordinates: [

            [minLon, maxLat],
            [maxLon, maxLat],
            [maxLon, minLat],
            [minLon, minLat],
        ]*/

         coordinates: [
            [-20, -50],
            [40, -50],
            [40, 80],
            [-20, 80],
        ]
}

projection
.fitExtent([[0, 0], [width, height]], extent);

const filtered = topojson.feature(worldMap, worldMap.objects.ne_10m_admin_0_countries).features.filter(f => f.properties.name != 'Antarctica')

const map = d3.select('.vac-map-container')
.append('svg')
.attr('id', 'vaccines-world-map-svg')
.attr('width', width)
.attr('height', height);

let colors = ['#E6F5FF', '#00B2FF', '#1896D7', '#056DA1', '#1C506A', '#333333'];

let colorScale = d3.scaleThreshold()
.range(colors);

colors.map(d => {

	d3.select('.vac-key-bar')
	.append('div')
	.attr('class', 'vac-key-color-box')
	.style('background', d)
})

for (var i = 0; i < colors.length + 1; i++) {

	d3.select('.vac-key-footer')
	.append('div')
	.attr('id', 'vac-key-text-' + i)
	.attr('class', 'vac-key-text-box')
	.html(i)
}

let namesToDisplay = [];
let casesToDisplay = [];
let casesHundredToDisplay = [];


d3.csv('https://interactive.guim.co.uk/2021/jan/vaccinations/vaccinations.csv')
.then(data => {

	let max = d3.max(data, d => +d.people_vaccinated_per_hundred);

	colorScale.domain([max/6,max/5,max/4,max/3,max/2,max])

	let divider = 0;

	for (var i = 1; i <= 7; i++) {

		let divider = 7 - i;

		d3.select('#vac-key-text-' + i)
		.html(Math.round(+max / divider))
	}

	map.append('g')
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => d.properties.ISO_A3_EH)
	.attr('fill', '#DADADA')
	.attr('stroke', '#ffffff')
	.attr('stroke-width','0.5px')
	.attr('pointer-events', 'none')
	.attr('stroke-linecap', 'round')
	.on('mouseover', event => {
		highlight(event.target.attributes.class.value)
		manageOver(event.target.attributes.class.value)
	})
	.on('mouseout', event => resetHighlight())
	.on('mousemove', event => manageMove(event))

	const isoCodes = [...new Set(data.map(d => d.iso_code))];

	isoCodes.map( code =>{

		let countryDataRaw = data.filter( d => d.iso_code === code);
		let countryDate = d3.max([...new Set(countryDataRaw.map(d => new Date(d.date)))]);

		let country = data.filter(d => d.iso_code === code)

		let latest = country.find(d => new Date(d.date).getTime() === countryDate.getTime())

		namesToDisplay[code] = latest.location;
		casesToDisplay[code] = latest.people_vaccinated;
		casesHundredToDisplay[code] = latest.people_vaccinated_per_hundred;

		if(latest.iso_code.length == 3)
		{
			console.log(latest.people_vaccinated_per_hundred, colorScale(latest.people_vaccinated_per_hundred))
			d3.selectAll('.' + code)
			.attr('fill', colorScale(+latest.people_vaccinated_per_hundred))
			.attr('pointer-events', 'all');

			console.log(code, latest.iso_code)
		}

		
	})

	const strokeMap = map.append('g')
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => 'stroke s-' + d.properties.ISO_A3_EH)
	.attr('fill','none')
	.attr('stroke-width','1.5px')
	.attr('pointer-events', 'none')
	.attr('stroke-linecap', 'round')


	if(window.resize)window.resize()
})

const manageOver = (value) => {

	d3.select('.vac-tooltip-container')
	.classed('over', true)

	let header = d3.select('.vac-tooltip-header-container')
	.html(namesToDisplay[value]);

	let cases = d3.select('.vac-cases-counter-value')
	.html(numberWithCommas(casesToDisplay[value]))

	let perHundred = d3.select('.vac-cases-hundred-value')
	.html(numberWithCommas(casesHundredToDisplay[value]) + '%')
}

const manageMove = (event) => {

	let here = d3.pointer(event);

    let left = here[0];
    let top = here[1] + d3.select('.vac-key-container').node().getBoundingClientRect().height + 40;
    let tWidth = d3.select('.vac-tooltip-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.vac-tooltip-container').node().getBoundingClientRect().height;

    let posX = left - tWidth / 2;
    let posY = top + 20;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;
    if(posY + tHeight + 20 > height) posY = posY - tHeight - 40;
    if(posY < 0) posY = 0;

    d3.select('.vac-tooltip-container').style('left',  posX + 'px')
    d3.select('.vac-tooltip-container').style('top', posY + 'px')

}

const highlight = (value) => {

	d3.select('.s-' + value)
	.style('stroke', '#333333')

}

const resetHighlight = () => {

	d3.select('.vac-tooltip-container')
	.classed('over', false)

	d3.selectAll('.stroke')
	.style('stroke', 'none')
}