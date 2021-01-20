import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'world-atlas/countries-50m.json'
import { numberWithCommas } from 'shared/js/util'

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.interactive-world-wrapper').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height =  isMobile ? width : width * 2.5 / 5;

let projection = d3.geoEckert4();

let path = d3.geoPath()
.projection(projection);

projection.fitSize([width, height], topojson.feature(worldMap, worldMap.objects.countries));

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



const map = d3.select('.interactive-world-wrapper')
.append('svg')
.attr('id', 'coronavirus-world-map-svg')
.attr('width', width)
.attr('height', height);

let colors = ['#F2EBDC', '#F5BE2C', '#ED6300', '#CC0A11', '#951D7A', '#333333'];

let colorScale = d3.scaleLinear()
.range([0,6]);

d3.json('https://interactive.guim.co.uk/2021/jan/jhu/processed-jhu-cases-data.json')
.then(data => {

	let max = d3.max(data, d => d.fortnightrate);

	colorScale.domain([0,max])

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
	.attr('pointer-events', 'none')
	.on('mouseover', event => {
		highlight(event.target.attributes.class.value)

		manageOver(event.target.attributes.class.value)
	})
	.on('mouseout', event => resetHighlight())
	.on('mousemove', event => manageMove(event))

	data.map(d => {

		let replaced = d['Country/Region'].replace(/[^\w]/gi, '');

		namesToDisplay[replaced] = d['Country/Region'];
		casesToDisplay[replaced] = d.allTime;
		casesMillionToDisplay[replaced] = parseInt(+d.fortnightrate * 1000000);

		map.selectAll('.' + replaced)
		.attr('fill', colors[parseInt(colorScale(d.fortnightrate))])
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

	/*console.log(d3.pointer(event))*/

	let here = d3.pointer(event);

    let left = here[0];
    let top = here[1];
    let tWidth = d3.select('.tooltip-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.tooltip-container').node().getBoundingClientRect().height;

    let posX = left + 10;
    let posY = top + 10;

    if(posX + tWidth > width)posX = width - tWidth - 2

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