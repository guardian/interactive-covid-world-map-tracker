import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'assets/ne_10m_admin_0_countries_crimea_ukraine.json'
import { numberWithCommas } from 'shared/js/util'
import scaleCluster from 'd3-scale-cluster';

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.map-container').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height =  width * 2.5 / 5;

let projection = d3.geoRobinson();

let path = d3.geoPath()
.projection(projection);

let extent = {
        type: "LineString",

         coordinates: [
            [-20, -50],
            [40, -50],
            [40, 80],
            [-20, 80],
        ]
}

projection
.fitExtent([[0, 0], [width, height]], extent);

const filtered = topojson.feature(worldMap, worldMap.objects.ne_10m_admin_0_countries_crimea_ukraine).features.filter(f => f.properties.name != 'Antarctica')

let matches = [
{atlasName:'United States of America', jhName:'US'},
{atlasName:'United Kingdom', jhName:'UK'},
{atlasName:'Myanmar', jhName:'Burma'},
{atlasName:'South Korea', jhName:'South Korea'},
{atlasName:'Czechia', jhName:'Czech Republic'},
{atlasName:'Solomon', jhName:'Solomon Islands'},
{atlasName:"Côte d'Ivoire", jhName:"Cote d'Ivoire"},
{atlasName:'Macedonia', jhName:'North Macedonia'},
{atlasName:'Dominican Rep.', jhName:'Dominican Republic'},
{atlasName:'Somaliland', jhName:'Somalia'},
{atlasName:'eSwatini', jhName:'Eswatini'},
{atlasName:'Eq. Guinea', jhName:'Equatorial Guinea'},
{atlasName:'Central African Rep.', jhName:'Central African Republic'},
{atlasName:'S. Sudan', jhName:'South Sudan'},
{atlasName:'Dem. Rep. Congo', jhName:'Congo (Kinshasa)'},
{atlasName:'Congo', jhName:'Congo (Brazzaville)'},
{atlasName:'Palestine', jhName:'West Bank and Gaza'},
{atlasName:'N. Cyprus', jhName:'Cyprus'},
{atlasName:'Bosnia and Herz.', jhName:'Bosnia and Herzegovina'}
];

let namesToDisplay = [];
let casesToDisplay = [];
let casesMillionToDisplay = [];

const map = d3.select('.map-container')
.append('svg')
.attr('id', 'coronavirus-world-map-svg')
.attr('width', width)
.attr('height', height);

map.append("rect")
    .attr("class", "gv-background")
    .attr("width", width)
    .attr("height", height)
    .on("click", d => clicked())

let resetZoom = d3.select("#gv-choropleth-svg")
.on("click", d => clicked());

const g = map.append('g');

const choropleth = g.append('g');
const strokeMap = g.append('g');

const colors = ['#fadae7', '#f4b4ce', '#ee8db4', '#e86297', '#df2770'];

/*let colorScale = d3.scaleThreshold()
.range(colors);*/

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


d3.json('https://interactive.guim.co.uk/2021/jan/jhu/allcountries/latest7dayratepermillion/cases.json')
.then(dataRaw => {

	const data = dataRaw.filter(f => !isNaN(+f.sevenDayRate[Object.getOwnPropertyNames(f.sevenDayRate)[0]]))

	//let max = d3.max(data, d => +d.sevenDayRate[Object.getOwnPropertyNames(d.sevenDayRate)[0]]);

	//console.log(data.find(f => +f.sevenDayRate[Object.getOwnPropertyNames(f.sevenDayRate)[0]] === max))

	
	/*let max = d3.max(data, d => +d.sevenDayRate[Object.getOwnPropertyNames(d.sevenDayRate)[0]]); 

	let arr = []

	for (var i = 1; i <= 7; i++) {

		let divider = 7 - i;

		d3.select('#key-text-' + i)
		.html(numberWithCommas(Math.floor((+max / divider)/100)*100))

		arr.push(Math.floor((+max / divider)/100)*100)
	}

	let cont = 0;

	arr.forEach((d,i) => {

		console.log(cont,d)

		let filtered = data.filter(f => {

			let value = +f.sevenDayRate[Object.getOwnPropertyNames(f.sevenDayRate)[0]];

			return value >= cont && value < d


		}).length

		console.log(filtered)

		cont = d
	})

	colorScale.domain(arr)*/

	let scale = scaleCluster()
	.domain(data.map(d => +d.sevenDayRate[Object.getOwnPropertyNames(d.sevenDayRate)[0]]))
	.range(colors)

	let round = Math.pow(10,parseInt(Math.log10(scale.clusters()[0])));

	scale.domain(data.map(d => {

		let value = +d.sevenDayRate[Object.getOwnPropertyNames(d.sevenDayRate)[0]];

		return Math.floor(value / round) * round

	}))


	colors.forEach((d,i) => {

		d3.select('#key-text-' + i)
		.html(numberWithCommas(scale.invertExtent(d)[0]))
	})

	

	choropleth
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => {
		let region = d.properties.NAME;
		let match = matches.find(f => f.atlasName == region)

		//console.log(region)
		if(match) return match.jhName.replace(/[^\w]/gi, '')
		else return region.replace(/[^\w]/gi, '')
	})
	.attr('fill', '#DADADA')
	.attr('stroke', '#ffffff')
	.attr('stroke-width','1px')
	.attr('pointer-events', 'none')
	.attr('stroke-linecap', 'round')
	.on('mouseover', event => {
		highlight(event.target.attributes.class.value)
		manageOver(event.target.attributes.class.value)
	})
	.on('mouseout', event => resetHighlight())
	.on('mousemove', event => manageMove(event))
	.on('click', (event,d) => clicked(d))

	data.map(d => {

		let replaced = d['Country/Region'].replace(/[^\w]/gi, '');

		let value = +d.sevenDayRate[Object.getOwnPropertyNames(d.sevenDayRate)[0]];


		
		namesToDisplay[replaced] = d['Country/Region'];
		casesMillionToDisplay[replaced] = (+d.allTimeRate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0});
		//casesToDisplay[replaced] = (+d.alltimerate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0});
		//casesMillionToDisplay[replaced] = (+d.fortnightrate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0});

		//console.log(d['Country/Region'], replaced, (+d.fortnightrate * 1000000).toLocaleString('en-GB',{maximumFractionDigits: 0}))

		casesToDisplay[replaced] = value;

		map.selectAll('.' + replaced)
		//.attr('fill', colorScale(d.fortnightrate))
		.attr('fill', scale(value))
		.attr('pointer-events', 'all')
		
	})

	strokeMap
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => {
		let region = d.properties.NAME;
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
	.html(namesToDisplay[value.split(' ')[0]]);

	if(casesMillionToDisplay[value.split(' ')[0]] && casesToDisplay[value.split(' ')[0]])
	{
		let cases = d3.select('.cases-counter-value')
		.html(numberWithCommas(casesMillionToDisplay[value.split(' ')[0]]))

		let perMillion = d3.select('.cases-million-value')
		.html(numberWithCommas(casesToDisplay[value.split(' ')[0]]))
	}
	else
	{
		let cases = d3.select('.cases-counter-value')
		.html('-')

		let perMillion = d3.select('.cases-million-value')
		.html('-')
	}
}

const manageMove = (event) => {

	let left = event.clientX + -atomEl.getBoundingClientRect().left;
    let top = event.clientY + -atomEl.getBoundingClientRect().top;


    let tWidth = d3.select('.tooltip-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.tooltip-container').node().getBoundingClientRect().height;

    let posX = left - tWidth /2;
    let posY = top + tHeight + 50;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;
    if(posY + tHeight > height) posY = top + 20;
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

let centered;

const clicked = (d) => {

	//console.log(d)

  var x, y, k;

  if (d && centered !== d) {

    var centroid = path.centroid(d);

    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")

  
  choropleth.selectAll('path')
  .transition()
      .duration(750)
 .style("stroke-width", 1 / k + "px")


  strokeMap.selectAll('path')
  .transition()
      .duration(750)
  .style("stroke-width", 1.5 / k + "px")
  .on('end', d => {
 	centered ? strokeMap.selectAll('path').style("stroke-width", 0.5 + "px") : strokeMap.selectAll('path').style("stroke-width", 1.5 + "px")
 })
  

  resetZoom
  .style('display', centered ? 'block' : 'none')
}