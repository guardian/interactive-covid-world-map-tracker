import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
//import worldMap from 'assets/ne_10m_admin_0_countries_crimea_ukraine.json'
import worldMap from 'assets/world-map-crimea-ukr-continent.json'
import { numberWithCommas } from 'shared/js/util'

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.map-europe-container').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height =  width * 520 / 620;

let projection = d3.geoAlbers()
.rotate([-20.0, 0.0]);

let path = d3.geoPath()
.projection(projection);

let extent = {
        type: "LineString",

         coordinates: [
            [-8, 75],
            [25, 75],
            [25, 35],
            [-8, 35],
        ]
}

projection
.fitExtent([[0, 0], [width, height]], extent);

const filtered = topojson.feature(worldMap, worldMap.objects['world-map-crimea-ukr-continent']).features.filter(f => f.properties.REGION_UN == 'Europe' || f.properties.REGION_UN == 'Africa' || f.properties.REGION_UN == 'Asia')

let namesToDisplay = [];
let casesToDisplay = [];
let casesMillionToDisplay = [];

const map = d3.select('.map-europe-container')
.append('svg')
.attr('id', 'coronavirus-europe-map-svg')
.attr('width', width)
.attr('height', height);

const choropleth = map.append('g');
const smalls = map.append('g')

let colors = ['#FBE5AB', '#F5BE2C', '#ED6300', '#CC0A11', '#951D7A', '#333333'];

let colorScale = d3.scaleThreshold()
.range(colors);

colors.map(d => {

	d3.select('.key-europe-bar')
	.append('div')
	.attr('class', 'key-europe-color-box')
	.style('background', d)
})

for (var i = 0; i < colors.length + 1; i++) {

	d3.select('.key-europe-footer')
	.append('div')
	.attr('id', 'key-europe-text-' + i)
	.attr('class', 'key-europe-text-box')
	.html(i)
}


d3.json('https://interactive.guim.co.uk/2021/jan/jhu/processed-jhu-cases-data.json')
.then(data => {


	console.log(data)

	data.map(d => {

		let replaced = d['Country/Region'].replace(/[^\w]/gi, '');	

		if(replaced == 'UK')replaced = 'UnitedKingdom';
		if(replaced == 'CzechRepublic')replaced = 'Czechia';
		if(replaced == 'BosniaandHerzegovina')replaced = 'BosniaandHerz';
		if(replaced == 'NorthMacedonia')replaced = 'Macedonia';


		let match = filtered.find(f => f.properties.NAME.replace(/[^\w]/gi, '') === replaced)

		if(match)
		{
			match.alltimerate = +d.alltimerate;
			match.fortnightrate = +d.fortnightrate;
			match.alltimerate = +d.alltimerate;
		}

		
	})

	let max = d3.max(filtered.filter(f => f.properties.REGION_UN == 'Europe' && f.properties.REGION_WB.indexOf('Europe') != -1), d => +d.fortnightrate);

		console.log(max, filtered.find(f => +f.fortnightrate === max))



	colorScale.domain([max/6,max/5,max/4,max/3,max/2,max])

	let divider = 0;

	for (var i = 1; i <= 7; i++) {

		let divider = 7 - i;

		d3.select('#key-europe-text-' + i)
		.html(numberWithCommas(Math.round((+max * 1000000) / (divider)/100)*100))
	}




	choropleth
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => d.properties.ISO_A3_EH)
	.attr('fill', d => colorScale(+d.fortnightrate) || '#dadada' )
	.attr('stroke', '#ffffff')
	.attr('stroke-width','1px')
	.attr('stroke-linecap', 'round')
	.on('mouseover', (e,d) => {

		choropleth.selectAll('.' + d.properties.ISO_A3_EH)
		.classed('map-over', true)
		.raise()

		manageOver(d)
	})
	.on('mouseout', e => {
		choropleth.selectAll('path').classed('map-over', false)

		d3.select('.tooltip-europe-container')
		.classed('over', false)
	})
	.on('mousemove', e => manageMove(e))
	.attr('size', d => {

		let centroid = path.centroid(filtered.find(f => f.properties.ISO_A3_EH === d.properties.ISO_A3_EH));

		if(d.properties.ISO_A3_EH != '-99')	
		{
			let w = choropleth.select('.' + d.properties.ISO_A3_EH).node().getBoundingClientRect().width;

			if(w < 20 && w > 0 || d.properties.ISO_A3_EH === 'MDV')
			{

				let circle = smalls.append('circle')
				.attr('r', 5)
				.attr('cx', centroid[0] - 2.5)
				.attr('cy',  centroid[1] - 2.5)
				.attr('class', d.properties.ISO_A3_EH)
				.attr('fill', colorScale(d.fortnightrate) || '#dadada')
				.attr('stroke', '#ffffff')
				.attr('stroke-width','1px')
				.on('mouseover', e => {

					smalls.selectAll('.' + d.properties.ISO_A3_EH)
					.classed('map-over', true)
					.raise()

					manageOver(d)
				})
				.on('mousemove', e => manageMove(e))
				.on('mouseout', e => {
					
					smalls.selectAll('circle').classed('map-over', false)

					d3.select('.tooltip-asia-container')
					.classed('over', false)
				})
				
			}	
		}
	} )

	


	if(window.resize)window.resize()
})

const manageOver = (d) => {

	d3.select('.tooltip-europe-container')
	.classed('over', true)

	let header = d3.select('.tooltip-europe-header-container')
	.html(d.properties.NAME);

	console.log(d.alltimerate, d.fortnightrate, isNaN(+d.alltimerate), isNaN(+d.fortnightrate))

	let casesText = isNaN(+d.alltimerate) ? 'No data' : (+d.alltimerate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0})
	let fornightText = isNaN(+d.fortnightrate) ? 'No data' : (+d.fortnightrate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0})

	let cases = d3.select('.cases-europe-counter-value')
	.html(casesText)

	let perMillion = d3.select('.cases-europe-million-value')
	.html(fornightText)
}

const manageMove = (event) => {

	let left = event.clientX + -atomEl.getBoundingClientRect().left;
    let top = event.clientY + -atomEl.getBoundingClientRect().top;


    let tWidth = d3.select('.tooltip-europe-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.tooltip-europe-container').node().getBoundingClientRect().height;

    let posX = left - tWidth /2;
    let posY = top + tHeight +30;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;
    if(posY + tHeight > height) posY = top ;
    if(posY < 0) posY = 0;

    d3.select('.tooltip-europe-container').style('left',  posX + 'px')
    d3.select('.tooltip-europe-container').style('top', posY + 'px')

}

