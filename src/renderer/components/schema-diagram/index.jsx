import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import Graph from 'react-graph-vis';
import { tableRelations } from '../test-tables-to-cards.jsx';

function tableToLabelStr(table) {
  let str = `<b>${table[0]}</b>`;
  for (let i = 0; i < table[1].length; i++) {
    str += `\n<code>${table[1][i].name}</code>`;
  }
  return str;
}

function tableToSvgStr(table) {
  console.log(table);
  const fields = table[1];
  const lineHeight = 50;
  const height = (1 + fields.length) * lineHeight + 50;
  let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}">`;
  // display tableName
  svgStr += '<g>';
  svgStr +=
    '<rect x="0" y="0" rx="50" ry="50" width="100%" height="100%" fill="#ffffff" stroke-width="5" stroke="black" ></rect>';
  svgStr += `<text x="50" y="50" font-family="Verdana" font-size="35" font-weight="bolder" fill="black">${
    table[0]
  }</text>`;
  svgStr += '</g>';
  // display fields
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    svgStr += `<text x="50" y="${lineHeight * (i + 1) +
      50}" font-family="Verdana" font-size="25" fill="black">${field.name}</text>`;
  }
  svgStr += '</svg>';
  console.log(svgStr);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
}

class SchemaDiagram extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: false,
    };
  }

  handleClose() {
    this.setState({ isOpen: false });
  }

  handleShow() {
    this.setState({ isOpen: true });
  }

  render() {
    const { schemaInfo } = this.props;
    const { isOpen } = this.state;
    if (!schemaInfo) {
      return <div />;
    }

    // const images = cards.map(card => repng(card));
    const nodes = [];
    schemaInfo.forEach((table, id) => {
      //   nodes.push({ id, image: tableToSvgStr(table), shape: 'image' });
      nodes.push({
        id,
        font: { multi: 'html', size: 15 },
        label: tableToLabelStr(table),
        x: 40,
        y: 0,
      });
    });
    const edges = [];
    const relations = tableRelations(schemaInfo);
    for (let sourceIndex = 0; sourceIndex < relations.length; sourceIndex++) {
      const sourceTable = relations[sourceIndex];
      console.log(sourceTable);
      sourceTable.forEach(([relType, [targetIndex, fieldIndex]]) => {
        if (relType === 'belongsTo') {
          edges.push({ from: sourceIndex, to: targetIndex });
        }
      });
    }
    console.log(relations);

    const graph = {
      nodes,
      edges,
    };

    const options = {
      edges: {
        font: {
          size: 12,
        },
      },
      nodes: {
        shape: 'box',
        font: {
          bold: {
            color: '#0077aa',
          },
        },
      },

      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.4,
          springLength: 135,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 1,
        },
        maxVelocity: 50,
        minVelocity: 0.1,
        solver: 'barnesHut',
        stabilization: {
          enabled: false,
          iterations: 10,
          updateInterval: 100,
          onlyDynamicEdges: false,
          fit: true,
        },
        timestep: 0.5,
        adaptiveTimestep: true,
      },
    };

    const events = {
      select(event) {
        var { nodes, edges } = event;
      },
    };

    return (
      <div>
        <button type="button" className="pt-button pt-icon-cog" onClick={::this.handleShow}>
          View Schema Diagram
        </button>

        <Modal show={isOpen} onHide={::this.handleClose} dialogClassName="full-screen-modal">
          <Modal.Header closeButton>
            <Modal.Title>Schema Diagram</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ width: '80vw', height: '70vh' }}>
              <Graph graph={graph} options={options} events={events} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="pt-button" onClick={::this.handleClose}>
              Close
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default SchemaDiagram;
