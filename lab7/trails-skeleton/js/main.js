// Global variables
let data, scatterplot, barchart;

// Initialize dispatcher to handle events between views
const dispatcher = d3.dispatch('filterCategories');

d3.csv('data/vancouver_trails.csv')
  .then(_data => {
    // Store the data in a local variable
    data = _data;
    
    // Data preprocessing - convert string values to numbers
    data.forEach(d => {
      d.distance = +d.distance; // Convert distance to number
      d.time = +d.time;         // Convert time to number
    });
    
    // Initialize color scale for difficulty levels
    const colorScale = d3.scaleOrdinal()
      .domain(['Easy', 'Intermediate', 'Difficult'])
      .range(['#74c476', '#31a354', '#006d2c']); // Green color scheme
    
    // Initialize visualization objects
    scatterplot = new Scatterplot({
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);
    scatterplot.updateVis();
    
    barchart = new Barchart({
      parentElement: '#barchart',
      colorScale: colorScale
    }, dispatcher, data);
    barchart.updateVis();
    
    // Listen for the filterCategories event
    dispatcher.on('filterCategories', selectedCategories => {
      if (selectedCategories.length == 0) {
        scatterplot.data = data;
      } else {
        scatterplot.data = data.filter(d => selectedCategories.includes(d.difficulty));
      }
      scatterplot.updateVis();
    });
  })
  .catch(error => console.error(error));