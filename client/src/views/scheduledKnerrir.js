import React from 'react';
import Base from '../components/base';
import ContainersPanel from '../components/containersPanel';
import PodCpuChart from '../components/podCpuChart';
import DeleteButton from '../components/deleteButton';
import EventsPanel from '../components/eventsPanel';
import Field from '../components/field';
import ItemHeader from '../components/itemHeader';
import Loading from '../components/loading';
import MetadataFields from '../components/metadataFields';
import PodsPanel from '../components/podsPanel';
import KnerrirPanel from '../components/knerrirPanel';
import PodRamChart from '../components/podRamChart';
import SaveButton from '../components/saveButton';
import api from '../services/api';
import getMetrics from '../utils/metricsHelpers';
import {filterByOwner, filterByOwners} from '../utils/filterHelper';
import {defaultSortInfo} from '../components/sorter';
import ChartsContainer from '../components/chartsContainer';

const service = api.scheduledKnerrir;

export default class ScheduledKnerrir extends Base {
    state = {
        podsSort: defaultSortInfo(x => this.setState({podsSort: x})),
        eventsSort: defaultSortInfo(x => this.setState({eventsSort: x})),
    };

    componentDidMount() {
        const {namespace, name} = this.props;

        this.registerApi({
            item: service.get(namespace, name, item => this.setState({item})),
            pods: api.pod.list(namespace, pods => this.setState({pods})),
            knerrirs: api.knerrir.list(namespace, knerrir => this.setState({knerrir})),
            events: api.event.list(namespace, events => this.setState({events})),
            metrics: api.metrics.pods(namespace, metrics => this.setState({metrics})),
        });
    }

    render() {
        const {namespace, name} = this.props;
        const {item, pods, knerrir, events, metrics, podsSort, eventsSort} = this.state;

        const filteredKnerrirs = filterByOwner(knerrir, item);
        const filteredPods = filterByOwners(pods, filteredKnerrirs);
        const filteredEvents = filterByOwners(events, filteredPods);
        const filteredMetrics = getMetrics(filteredPods, metrics);

        return (
            <div id='content'>
                <ItemHeader title={['Scheduled Knerrir', namespace, name]} ready={!!item}>
                    <>
                        <SaveButton
                            item={item}
                            onSave={x => service.put(x)}
                        />

                        <DeleteButton
                            onDelete={() => service.delete(namespace, name)}
                        />
                    </>
                </ItemHeader>

                <ChartsContainer>
                    <div className='charts_item'>
                        <div className='charts_number'>{(item && item.status.pastFailedRunNames.length ) ? item.status.pastFailedRunNames.length : 0}</div>
                        <div className='charts_itemLabel'>Active</div>
                    </div>
                    <PodCpuChart items={filteredPods} metrics={filteredMetrics} />
                    <PodRamChart items={filteredPods} metrics={filteredMetrics} />
                </ChartsContainer>

                <div className='contentPanel'>
                    {!item ? <Loading /> : (
                        <div>
                            <MetadataFields item={item} />
                            <Field name='Image' value={item.spec.template.image} />
                            <Field name='Schedule' value={item.spec.schedule} />
                            <Field name='Suspend' value={item.spec.suspend} />
                            <Field name='Last Scheduled' value={item.status.lastRunName} />
                        </div>
                    )}
                </div>

                <ContainersPanel spec={item && item.spec.template} />

                {/* TODO: this actually need to be a list of jobs */}

                <div className='contentPanel_header'>Knerrirs</div>
                <KnerrirPanel
                    items={filteredKnerrirs}
                    sort={podsSort}
                    metrics={filteredMetrics}
                    skipNamespace={true}
                />  

                <div className='contentPanel_header'>Pods</div>
                <PodsPanel
                    items={filteredPods}
                    sort={podsSort}
                    metrics={filteredMetrics}
                    skipNamespace={true}
                />

                <div className='contentPanel_header'>Events</div>
                <EventsPanel
                    sort={eventsSort}
                    shortList={true}
                    items={filteredEvents}
                />
            </div>
        );
    }
}