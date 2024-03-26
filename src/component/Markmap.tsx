import React, { Component } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

interface MarkmapClassProps {
    initValue?: string;
}

export default class MarkmapClass extends Component<MarkmapClassProps> {

  private svg: SVGSVGElement;
  private mm: Markmap;
  private content: string;

  constructor(props) {
    super(props);
    this.content = props.initValue || '';
  }

  bindSvg = (el) => {
    this.svg = el;
  };

  componentDidMount() {
    this.mm = Markmap.create(this.svg);
    this.updateSvg();
  }

  handleChange = (e) => {
    this.setState({ value: e.target.value }, this.updateSvg);
  };

  updateSvg = () => {
    const { root } = transformer.transform(this.content);
    this.mm.setData(root);
    this.mm.fit();
  };

  render() {
    return (
      <React.Fragment>
        <svg style={{ width: '100%', height: '100vh' }} className="flex-1" ref={this.bindSvg} />
      </React.Fragment>
    );
  }
}
