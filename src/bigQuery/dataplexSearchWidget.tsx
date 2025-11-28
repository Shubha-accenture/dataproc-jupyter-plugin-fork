import { Panel } from '@lumino/widgets'; 
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';


export class  DataplexSearchWidget extends Panel { 
  // private app: JupyterLab;
  // private currentQuery: string = '';

  constructor(app: JupyterLab, themeManager: IThemeManager, initialSearchTerm: string = '') {
    super(); 
    // this.app = app;
    // this.currentQuery = initialSearchTerm;

    this.title.label = 'NL Dataset Search';
    this.addClass('jp-NaturalLanguageSearchWidget');

    this.node.style.display = 'flex';
    this.node.style.flexDirection = 'row';
    this.node.style.height = '100%';
    this.node.style.gap = '16px'; 
  }
}