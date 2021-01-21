import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'world-atlas/countries-50m.json'
import { numberWithCommas } from 'shared/js/util'

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.map-container').node()

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

const filtered = topojson.feature(worldMap, worldMap.objects.countries).features.filter(f => f.properties.name != 'Antarctica')

let matches = [
{atlasName:'United States of America', jhName:'US'},
{atlasName:'United Kingdom', jhName:'UK'},
{atlasName:'Myanmar', jhName:'Burma'},
{atlasName:'South Korea', jhName:'Korea, South'},
{atlasName:'Czechia', jhName:'Czech Republic'},
{atlasName:'Bosnia', jhName:'Bosnia and Herzegovina'},
{atlasName:'Solomon', jhName:'Solomon Islands'},
{atlasName:"Côte d'Ivoire", jhName:'Cote dIvoire'},
{atlasName:'Macedonia', jhName:'North Macedonia'},
{atlasName:'Dominican', jhName:'Dominican Republic'},
{atlasName:'Somaliland', jhName:'Somalia'},
{atlasName:'eSwatini', jhName:'Eswatini'},
{atlasName:'Eq. Guinea', jhName:'Equatorial Guinea'},
{atlasName:'Central African Rep.', jhName:'Central African Republic'},
{atlasName:'S. Sudan', jhName:'South Sudan'},
{atlasName:'Dem. Rep. Congo', jhName:'Congo (Kinshasa)'},
{atlasName:'Congo', jhName:'Congo (Brazzaville)'},
{atlasName:'Palestine', jhName:'West Bank and Gaza'},
{atlasName:'N. Cyprus', jhName:'Cyprus'}
];

let namesToDisplay = [];
let casesToDisplay = [];
let casesMillionToDisplay = [];

const map = d3.select('.map-container')
.append('svg')
.attr('id', 'coronavirus-world-map-svg')
.attr('width', width)
.attr('height', height);

let colors = ['#F5BE2C', '#FF7F00', '#ED6300', '#CC0A11', '#951D7A', '#333333'];

let colorScale = d3.scaleThreshold()
.range(colors);

colors.map(d => {

	d3.select('.key-bar')
	.append('div')
	.attr('class', 'key-color-box')
	.style('background', d)
})

for (var i = 0; i < colors.length + 1; i++) {

	d3.select('.key-footer')
	.append('div')
	.attr('id', 'key-text-' + i)
	.attr('class', 'key-text-box')
	.html(i)
}


d3.json('https://interactive.guim.co.uk/2021/jan/jhu/processed-jhu-cases-data.json')
.then(data => {

	let max = d3.max(data, d => d.fortnightrate);

	colorScale.domain([max/6,max/5,max/4,max/3,max/2,max])

	let divider = 0;

	for (var i = 1; i <= 7; i++) {

		let divider = 7 - i;

		d3.select('#key-text-' + (i))
		.html(numberWithCommas(Math.round((+max * 1000000) / (divider)/100)*100))
	}


	map.append('g')
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => {
		let region = d.properties.name;
		let match = matches.find(f => f.atlasName == region)
		if(match) return match.jhName.replace(/[^\w]/gi, '')
		else return region.replace(/[^\w]/gi, '')
	})
	.attr('fill', '#dadada')
	.attr('stroke', '#fafafa')
	.attr('stroke-width','0.5px')
	.attr('pointer-events', 'none')
	.attr('stroke-linecap', 'round')
	.on('mouseover', event => {
		highlight(event.target.attributes.class.value)

		manageOver(event.target.attributes.class.value)
	})
	.on('mouseout', event => resetHighlight())
	.on('mousemove', event => manageMove(event))

	data.map(d => {

		let replaced = d['Country/Region'].replace(/[^\w]/gi, '');

		namesToDisplay[replaced] = d['Country/Region'];
		casesToDisplay[replaced] = (+d.alltimerate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0});
		casesMillionToDisplay[replaced] = (+d.fortnightrate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0});

		map.selectAll('.' + replaced)
		.attr('fill', colorScale(d.fortnightrate))
		.attr('pointer-events', 'all')
		
	})

	const strokeMap = map.append('g')
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => {
		let region = d.properties.name;
		let match = matches.find(f => f.atlasName == region)
		if(match) return 'stroke s-' + match.jhName.replace(/[^\w]/gi, '')
		else return 'stroke s-' + region.replace(/[^\w]/gi, '')
	})
	.attr('fill','none')
	.attr('stroke-width','1.5px')
	.attr('pointer-events', 'none')
	.attr('stroke-linecap', 'round')


	if(window.resize)window.resize()
})



const manageOver = (value) => {

	d3.select('.tooltip-container')
	.classed('over', true)

	let header = d3.select('.tooltip-header-container')
	.html(namesToDisplay[value]);

	let cases = d3.select('.cases-counter-value')
	.html(numberWithCommas(casesToDisplay[value]))

	let perMillion = d3.select('.cases-million-value')
	.html(numberWithCommas(casesMillionToDisplay[value]))
}

const manageMove = (event) => {

	let here = d3.pointer(event);

    let left = here[0];
    let top = here[1] + d3.select('.key-container').node().getBoundingClientRect().height + 40;
    let tWidth = d3.select('.tooltip-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.tooltip-container').node().getBoundingClientRect().height;

    let posX = left - tWidth / 2;
    let posY = top + 20;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;
    if(posY + tHeight + 20 > height) posY = posY - tHeight - 40;
    if(posY < 0) posY = 0;

    d3.select('.tooltip-container').style('left',  posX + 'px')
    d3.select('.tooltip-container').style('top', posY + 'px')

}

const highlight = (value) => {

	d3.select('.s-' + value)
	.style('stroke', '#333333')

}

const resetHighlight = () => {

	d3.select('.tooltip-container')
	.classed('over', false)

	d3.selectAll('.stroke')
	.style('stroke', 'none')
}