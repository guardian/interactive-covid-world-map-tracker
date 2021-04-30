import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'assets/ne_10m_admin_0_countries_crimea_ukraine.json'
import { numberWithCommas } from 'shared/js/util'

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.vac-map-europe-container').node()

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



const filtered = topojson.feature(worldMap, worldMap.objects.ne_10m_admin_0_countries_crimea_ukraine).features.filter(f => f.properties.name != 'Antarctica')

const map = d3.select('.vac-map-europe-container')
.append('svg')
.attr('id', 'vaccines-world-map-svg')
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

let colors = ['#E6F5FF', '#A1D5F2', '#5DB6E4', '#1896D7', '#056DA1', '#052962'];

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

	let max = 100//d3.max(data, d => +d.total_vaccinations_per_hundred);

	colorScale.domain([max/6,max/5,max/4,max/3,max/2,max])

	let divider = 0;

	for (var i = 1; i <= 7; i++) {

		let divider = 7 - i;

		d3.select('#vac-key-text-' + i)
		.html(Math.round(+max / divider))
	}

	choropleth
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('d', path)
	.attr('class', d => d.properties.ISO_A3_EH)
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

	const isoCodes = [...new Set(data.map(d => d.iso_code))];

	isoCodes.map( code =>{

		let countryDataRaw = data.filter( d => d.iso_code === code);
		let countryDate = d3.max([...new Set(countryDataRaw.map(d => new Date(d.date)))]);

		let country = data.filter(d => d.iso_code === code)

		let latest = country.find(d => new Date(d.date).getTime() === countryDate.getTime())

		//console.log(code, latest.people_vaccinated, latest.total_vaccinations_per_hundred)

		namesToDisplay[code] = latest.location;
		casesToDisplay[code] = latest.people_vaccinated || '-';
		casesHundredToDisplay[code] = latest.total_vaccinations_per_hundred || '-';

		if(latest.iso_code.length == 3)
		{
			d3.selectAll('.' + code)
			.attr('fill', colorScale(+latest.total_vaccinations_per_hundred))
			.attr('pointer-events', 'all');
		}

		
	})

	strokeMap
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
	.html(namesToDisplay[value.split(' ')[0]]);

	let cases = d3.select('.vac-cases-counter-value')
	.html(numberWithCommas(casesToDisplay[value.split(' ')[0]]))

	let perHundred = d3.select('.vac-cases-hundred-value')
	.html(numberWithCommas(casesHundredToDisplay[value.split(' ')[0]]) + '%')
}

const manageMove = (event) => {

    let left = event.clientX + -atomEl.getBoundingClientRect().left;
    let top = event.clientY + -atomEl.getBoundingClientRect().top;


    let tWidth = d3.select('.vac-tooltip-container').node().getBoundingClientRect().width;
    let tHeight = d3.select('.vac-tooltip-container').node().getBoundingClientRect().height;

    let posX = left - tWidth /2;
    let posY = top + tHeight + 50;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;
    if(posY + tHeight > height) posY = top + 20;
    if(posY < 0) posY = 0;

    d3.select('.vac-tooltip-container').style('left',  posX + 'px')
    d3.select('.vac-tooltip-container').style('top', posY + 'px')

}

const highlight = (value) => {

	d3.select('.s-' + value.split(' ')[0])
	.style('stroke', '#333333')

}

const resetHighlight = () => {

	d3.select('.vac-tooltip-container')
	.classed('over', false)

	d3.selectAll('.stroke')
	.style('stroke', 'none')
}


let centered;

const clicked = (d) => {

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